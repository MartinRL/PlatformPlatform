---
trigger: glob
globs: **/Endpoints/*.cs,*Endpoints.cs
description: Rules for ASP.NET minimal API endpoints
---

# API Endpoints

Carefully follow these instructions when implementing minimal API endpoints in the backend, including structure, route conventions, and usage patterns.

## Implementation

1. Create API endpoint classes in the `/application/[scs-name]/Api/Endpoints` directory, organized by feature area.
2. Create an endpoint class implementing the `IEndpoints` interface with proper naming (`[Feature]Endpoints.cs`).
3. Define a constant string for `RoutesPrefix`: `/api/[scs-name]/[Feature]`:
   ```csharp
   private const string RoutesPrefix = "/api/account-management/users";
   ```
4. Set up the route group with a tag name of the feature and `.RequireAuthorization()` and `.ProducesValidationProblem()`. E.g.: 
   ```csharp
   var group = routes.MapGroup(RoutesPrefix).WithTags("Users").RequireAuthorization().ProducesValidationProblem();
   ```
5. Structure each endpoint in exactly 3 lines (no logic in the body):
   - Line 1: Signature with route and parameters (don't break the line even if longer than 120 characters).
   - Line 2: Expression calling `=> mediator.Send()`.
   - Line 3: Optional configuration (`.Produces<T>()`, `.AllowAnonymous()`, etc.).
6. Follow these requirements:
   - Use [Strongly Typed IDs](/.windsurf/rules/backend/strongly-typed-ids.md) for route parameters.
   - Return `ApiResult<T>` for queries and `ApiResult` or `IRequest<Result<T>>` for commands.
   - Use `[AsParameters]` for query parameters.
   - Use `with { Id = id }` syntax to bind route parameters to commands and queries.
7. After changing the API, make sure to run `cd developer-cli && dotnet run build --backend` to generate the OpenAPI JSON contract. Then run `cd developer-cli && dotnet run build --frontend` to trigger `openapi-typescript` to generate the API contract used by the frontend.
8. `IEndpoints` are automatically registered in the SharedKernel.

## Examples

### Example 1 - User Endpoints

```csharp
// ✅ DO: Structure endpoints in exactly 3 lines with no logic in the body
public sealed class UserEndpoints : IEndpoints
{
    private const string RoutesPrefix = "/api/account-management/users";

    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup(RoutesPrefix).WithTags("Users").RequireAuthorization().ProducesValidationProblem();

        group.MapGet("/", async Task<ApiResult<GetUsersResponse>> ([AsParameters] GetUsersQuery query, IMediator mediator)
            => await mediator.Send(query)
        ).Produces<GetUsersResponse>();

        group.MapDelete("/{id}", async Task<ApiResult> (UserId id, IMediator mediator)
            => await mediator.Send(new DeleteUserCommand(id))
        );

        group.MapPost("/bulk-delete", async Task<ApiResult> (BulkDeleteUsersCommand command, IMediator mediator)
            => await mediator.Send(command)
        );

        group.MapGet("/me", async Task<ApiResult<UserResponse>> ([AsParameters] GetUserQuery query, IMediator mediator)
            => await mediator.Send(query)
        ).Produces<UserResponse>();
    }
}

// ❌ DON'T: Add business logic inside endpoint methods or break the 3-line structure
public sealed class BadUserEndpoints : IEndpoints
{
    private const string RoutesPrefix = "/api/account-management/users";

    public void MapEndpoints(IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup(RoutesPrefix).WithTags("Users"); // ❌ DON'T: Skip .RequireAuthorization() even if all endpoints AllowAnonymous

        group.MapGet("/", async (IMediator mediator, HttpContext context) => 
        {
            // ❌ DON'T: Add business logic inside endpoint methods
            var tenantId = context.User.GetTenantId();
            var query = new GetUsersQuery { TenantId = tenantId };
            var result = await mediator.Send(query);
            return Results.Ok(result);
        });

        // ❌ DON'T: Use Put for commands that don't update an existing resource
        group.MapPut("/{id}/change-user-role", async Task<ApiResult> (
            UserId id,
            ChangeUserRoleCommand command,
            IMediator mediator
         ) // ❌ DON'T: Break the line even if it extends 120 characters
            => await mediator.Send(command with { Id = id })
        );

        // ❌ DON'T: Use MVC [FromBody] attribute
        group.MapPost("/bulk-delete", async Task<ApiResult> ([FromBody] BulkDeleteUsersCommand command, IMediator mediator)
            => await mediator.Send(command)
        );

        // ❌ DON'T: Forget leading slashes
        group.MapGet("me", async Task<ApiResult<UserResponse>> ([AsParameters] GetUserQuery query, IMediator mediator)
            => await mediator.Send(query)
        ).Produces<UserResponse>();

    }
}
```
