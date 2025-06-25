# CritterPP Architecture: Vertical Slice + Wolverine AggregateHandler

## Architecture Overview

CritterPP transforms PlatformPlatform using **Vertical Slice Architecture (VSA)** combined with **Wolverine's AggregateHandler workflow** and **Marten event sourcing**. This creates a "low ceremony" architecture that organizes code by business capability while leveraging the power of the Critter Stack.

## Core Architectural Patterns

### A-Frame Architecture (Wolverine Pattern)
- **Pure Business Logic**: Decider functions isolated from infrastructure concerns
- **Generated Infrastructure**: Wolverine generates all plumbing and orchestration code
- **Minimal Ceremony**: Business logic expressed with minimal boilerplate
- **Clear Boundaries**: Sharp separation between domain and infrastructure

### Vertical Slice Architecture (VSA)
- **Feature-Based Organization**: Code organized by business capabilities, not technical layers
- **Self-Contained Slices**: Each slice contains all code needed for a complete feature
- **Reduced Coupling**: Minimal dependencies between slices
- **Independent Testing**: Each slice can be tested in isolation

### Wolverine AggregateHandler Workflow
- **Aggregate State**: Immutable state records reconstructed from events
- **Decider Functions**: Pure functions for command → events transformation
- **Event Application**: Pure functions for event → state evolution
- **Code Generation**: Wolverine generates all handler orchestration code

### Specification-Driven Development
- **Given-When-Then**: Behavioral specifications drive implementation
- **Agentic Generation**: AI generates decider functions from specifications
- **Test-First**: Specifications become executable tests
- **Living Documentation**: Specifications serve as always-current documentation

## Vertical Slice Folder Structure

### Overall Project Organization
```
CritterPP/
├── Features/                    # All business features as vertical slices
│   ├── RegisterUser/           # User registration slice
│   ├── UpdateUserProfile/      # User profile update slice
│   ├── CreateTenant/           # Tenant creation slice
│   ├── AuthenticateUser/       # User authentication slice
│   └── SendNotification/       # Notification sending slice
├── SharedKernel/               # Cross-cutting concerns
│   ├── Events/                 # Base event types
│   ├── Commands/               # Base command types
│   ├── Projections/            # Base projection types
│   ├── Results/                # Result<T> implementations
│   └── Extensions/             # Wolverine/Marten extensions
└── Infrastructure/             # Infrastructure configuration
    ├── Database/               # Marten configuration
    ├── Messaging/              # Wolverine configuration
    └── Web/                    # ASP.NET Core setup
```

### Individual Vertical Slice Structure
```
Features/RegisterUser/
├── RegisterUser.cs             # Command + Decider + Events
├── UserRegistered.cs           # Event definition
├── UserState.cs               # Aggregate state record
├── UserSummaryProjection.cs   # Read model projection
├── RegisterUserSpecification.cs # Given-When-Then specs
└── Tests/                      # Tests for this slice
    ├── RegisterUserDeciderTests.cs    # Pure function tests
    ├── RegisterUserHandlerTests.cs    # Integration tests
    └── UserSummaryProjectionTests.cs  # Projection tests

Features/UpdateUserProfile/
├── UpdateUserProfile.cs        # Command + Decider + Events
├── UserProfileUpdated.cs       # Event definition
├── UserState.cs               # Shared aggregate state
├── UserDetailsProjection.cs   # Read model projection
├── UpdateUserProfileSpecification.cs # Given-When-Then specs
└── Tests/                      # Tests for this slice
    ├── UpdateUserProfileDeciderTests.cs   # Pure function tests
    ├── UpdateUserProfileHandlerTests.cs   # Integration tests
    └── UserDetailsProjectionTests.cs      # Projection tests
```

### Technology Stack
```
Wolverine AggregateHandler Workflow
├── Command Processing
│   ├── HTTP Endpoint (Minimal API)
│   ├── Command Validation
│   ├── Load Aggregate State (Marten)
│   ├── Decider Function (Pure)
│   ├── Store Events (Marten)
│   └── Update Projections (Marten)
├── Event Processing
│   ├── Event Handlers (Side Effects)
│   ├── Projection Updates
│   └── External Integrations
└── Query Processing
    ├── Projection Queries (Marten)
    ├── Live Aggregation (Optional)
    └── HTTP Response
```

## Wolverine AggregateHandler Pattern Implementation

### Complete Vertical Slice Example: User Registration

#### Command Definition with Handler
```csharp
// Features/UserManagement/Commands/RegisterUser.cs
public record RegisterUser(
    TenantId TenantId,
    string Email,
    UserRole Role
) : ICommand;

// Wolverine generates this handler automatically
public static class RegisterUserHandler
{
    // The entire aggregate handler workflow in one place
    public static UserRegistered Handle(
        RegisterUser command,
        UserState currentState)  // Marten loads this from events
    {
        // Pure decider function - no I/O, no async, no exceptions
        return currentState.Status switch
        {
            UserStatus.NotExists when IsValidEmail(command.Email) => 
                new UserRegistered(
                    UserId.New(),
                    command.TenantId,
                    command.Email.ToLowerInvariant(),
                    command.Role,
                    DateTimeOffset.UtcNow),
            
            UserStatus.NotExists => 
                throw new InvalidOperationException("Invalid email format"),
            
            _ => throw new InvalidOperationException("User already exists")
        };
    }

    private static bool IsValidEmail(string email) =>
        !string.IsNullOrWhiteSpace(email) && email.Contains('@');
}
```

#### Aggregate State (Immutable Record)
```csharp
// Features/UserManagement/State/UserState.cs
public record UserState(
    UserId Id,
    TenantId TenantId,
    string Email,
    string FirstName,
    string LastName,
    UserRole Role,
    UserStatus Status,
    DateTimeOffset CreatedAt
)
{
    // Initial state for new aggregates
    public static UserState NotExists => new(
        UserId.Empty,
        TenantId.Empty,
        string.Empty,
        string.Empty,
        string.Empty,
        UserRole.Member,
        UserStatus.NotExists,
        DateTimeOffset.MinValue
    );

    // Pure function for state evolution
    public UserState Apply(UserRegistered @event) => this with
    {
        Id = @event.UserId,
        TenantId = @event.TenantId,
        Email = @event.Email,
        Role = @event.Role,
        Status = UserStatus.Active,
        CreatedAt = @event.OccurredAt
    };

    public UserState Apply(UserProfileUpdated @event) => this with
    {
        FirstName = @event.FirstName,
        LastName = @event.LastName
    };
}
```

#### Events (Domain Facts)
```csharp
// Features/UserManagement/Events/UserRegistered.cs
public record UserRegistered(
    UserId UserId,
    TenantId TenantId,
    string Email,
    UserRole Role,
    DateTimeOffset OccurredAt
);

// Features/UserManagement/Events/UserProfileUpdated.cs
public record UserProfileUpdated(
    UserId UserId,
    string FirstName,
    string LastName,
    DateTimeOffset UpdatedAt
);
```

### Stream Naming and Configuration
```csharp
// Infrastructure/Database/MartenConfiguration.cs
public static class StreamConfiguration
{
    public static void ConfigureStreams(this StoreOptions options)
    {
        // User aggregate streams
        options.Events.StreamIdentity = StreamIdentity.AsString;
        
        // Stream naming conventions
        options.Events.AddEventType<UserRegistered>();
        options.Events.AddEventType<UserProfileUpdated>();
        
        // Aggregate configuration
        options.Projections.Snapshot<UserState>(SnapshotLifecycle.Inline);
    }
}
```

## Marten Projections (Read Models)

### Projection Definitions for Vertical Slice
```csharp
// Features/UserManagement/Projections/UserSummary.cs
public record UserSummary(
    string Id,
    string TenantId,
    string Email,
    string DisplayName,
    UserRole Role,
    UserStatus Status,
    DateTimeOffset CreatedAt
);

// Marten projection handler
public class UserSummaryProjection : MultiStreamProjection<UserSummary, string>
{
    public UserSummaryProjection()
    {
        Identity<UserRegistered>(x => x.UserId.Value);
        Identity<UserProfileUpdated>(x => x.UserId.Value);
    }

    public UserSummary Create(UserRegistered @event) => new(
        Id: @event.UserId.Value,
        TenantId: @event.TenantId.Value,
        Email: @event.Email,
        DisplayName: @event.Email, // Initially use email
        Role: @event.Role,
        Status: UserStatus.Active,
        CreatedAt: @event.OccurredAt
    );

    public UserSummary Apply(UserProfileUpdated @event, UserSummary current) =>
        current with
        {
            DisplayName = $"{@event.FirstName} {@event.LastName}".Trim()
        };
}
```

### Query Handling in Vertical Slice
```csharp
// Features/UserManagement/Queries/GetUser.cs
public record GetUser(UserId UserId) : IQuery<UserSummary?>;

public static class GetUserHandler
{
    public static async Task<UserSummary?> Handle(
        GetUser query,
        IQuerySession session,
        CancellationToken cancellationToken)
    {
        return await session
            .Query<UserSummary>()
            .Where(u => u.Id == query.UserId.Value)
            .SingleOrDefaultAsync(cancellationToken);
    }
}

// Features/UserManagement/Queries/GetUserList.cs  
public record GetUserList(
    TenantId TenantId,
    int Skip = 0,
    int Take = 50
) : IQuery<IReadOnlyList<UserSummary>>;

public static class GetUserListHandler
{
    public static async Task<IReadOnlyList<UserSummary>> Handle(
        GetUserList query,
        IQuerySession session,
        CancellationToken cancellationToken)
    {
        return await session
            .Query<UserSummary>()
            .Where(u => u.TenantId == query.TenantId.Value)
            .OrderBy(u => u.CreatedAt)
            .Skip(query.Skip)
            .Take(query.Take)
            .ToListAsync(cancellationToken);
    }
}
```

## HTTP API Integration

### Minimal API Endpoints for Vertical Slice
```csharp
// Features/UserManagement/UserManagementEndpoints.cs
public static class UserManagementEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/users").WithTags("Users");

        // Command endpoints
        group.MapPost("/", HandleRegisterUser)
            .WithSummary("Register a new user");
            
        group.MapPut("/{userId}", HandleUpdateProfile)
            .WithSummary("Update user profile");

        // Query endpoints  
        group.MapGet("/{userId}", HandleGetUser)
            .WithSummary("Get user by ID");
            
        group.MapGet("/", HandleGetUserList)
            .WithSummary("Get list of users for tenant");
    }

    // Wolverine handles the entire workflow automatically
    public static async Task<IResult> HandleRegisterUser(
        RegisterUser command,
        IMessageBus messageBus,
        CancellationToken cancellationToken)
    {
        // Wolverine generates this entire workflow:
        // 1. Load UserState from events
        // 2. Call RegisterUserHandler.Handle(command, currentState)  
        // 3. Store resulting event(s)
        // 4. Update projections
        // 5. Return result
        var result = await messageBus.InvokeAsync<UserRegistered>(command, cancellationToken);
        return Results.Ok(new { UserId = result.UserId.Value });
    }

    public static async Task<IResult> HandleGetUser(
        string userId,
        IMessageBus messageBus,
        CancellationToken cancellationToken)
    {
        var query = new GetUser(new UserId(userId));
        var user = await messageBus.InvokeAsync<UserSummary?>(query, cancellationToken);
        return user != null ? Results.Ok(user) : Results.NotFound();
    }

    public static async Task<IResult> HandleGetUserList(
        string tenantId,
        int skip = 0,
        int take = 50,
        IMessageBus messageBus = default!,
        CancellationToken cancellationToken = default)
    {
        var query = new GetUserList(new TenantId(tenantId), skip, take);
        var users = await messageBus.InvokeAsync<IReadOnlyList<UserSummary>>(query, cancellationToken);
        return Results.Ok(users);
    }
}
```

### Side Effect Handlers (Event Reactions)
```csharp
// Features/UserManagement/Events/UserEventHandlers.cs
public static class UserEventHandlers
{
    // Wolverine automatically subscribes to UserRegistered events
    public static async Task Handle(
        UserRegistered userRegistered,
        IEmailService emailService,
        ILogger<UserEventHandlers> logger)
    {
        try
        {
            await emailService.SendWelcomeEmailAsync(
                userRegistered.Email,
                $"Welcome to our platform!");
                
            logger.LogInformation(
                "Welcome email sent to user {UserId}",
                userRegistered.UserId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to send welcome email to user {UserId}",
                userRegistered.UserId);
            // Side effects should not fail the main workflow
        }
    }

    public static async Task Handle(
        UserProfileUpdated profileUpdated,
        INotificationService notificationService,
        ILogger<UserEventHandlers> logger)
    {
        await notificationService.NotifyAsync(
            profileUpdated.UserId,
            "Your profile has been updated successfully");
            
        logger.LogInformation(
            "Profile update notification sent to user {UserId}",
            profileUpdated.UserId);
    }
}
```

## Wolverine Configuration and Bootstrapping

### Application Startup Configuration
```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Wolverine with Marten integration
builder.Host.UseWolverine(opts =>
{
    // Enable code generation for optimal performance
    opts.CodeGeneration.TypeLoadMode = TypeLoadMode.Static;
    
    // Integrate with Marten for event sourcing
    opts.UseMartenEventSourcing(connectionString =>
    {
        connectionString.ConnectionString(builder.Configuration.GetConnectionString("Database"));
        
        // Configure event store
        connectionString.Events.StreamIdentity = StreamIdentity.AsString;
        
        // Auto-discover projections in vertical slices
        connectionString.Projections.Add<UserSummaryProjection>(ProjectionLifecycle.Inline);
        
        // Configure aggregate workflows
        connectionString.UseAggregateWorkflows();
    });
    
    // Auto-discover handlers from all feature slices
    opts.Discovery.IncludeType<RegisterUserHandler>();
    opts.Discovery.IncludeType<UserEventHandlers>();
    
    // Configure outbox for reliable messaging
    opts.Policies.UseDurableOutboxOnAllSendingEndpoints();
});

var app = builder.Build();

// Map all vertical slice endpoints
app.MapUserEndpoints();
app.MapTenantEndpoints();
app.MapAuthenticationEndpoints();

app.Run();
```

### Marten Configuration for Vertical Slices
```csharp
// Infrastructure/Database/MartenConfiguration.cs
public static class MartenConfiguration
{
    public static void ConfigureForVerticalSlices(this StoreOptions options)
    {
        // Event store configuration
        options.Events.StreamIdentity = StreamIdentity.AsString;
        
        // Auto-discover events from feature slices
        options.Events.AddEventTypesFromAssembly(typeof(UserRegistered).Assembly);
        
        // Configure projections from all slices
        options.Projections.Add<UserSummaryProjection>(ProjectionLifecycle.Inline);
        options.Projections.Add<TenantSummaryProjection>(ProjectionLifecycle.Inline);
        
        // Enable snapshots for aggregate state
        options.Projections.Snapshot<UserState>(SnapshotLifecycle.Inline);
        options.Projections.Snapshot<TenantState>(SnapshotLifecycle.Inline);
        
        // Configure for multi-tenancy
        options.Policies.ForAllDocuments(m =>
        {
            if (m.DocumentType.GetInterfaces().Contains(typeof(ITenantScoped)))
            {
                m.TenantIdColumn = "tenant_id";
            }
        });
    }
}
```

### Complete Vertical Slice Registration
```csharp
// Infrastructure/Extensions/ServiceCollectionExtensions.cs
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddVerticalSlices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register shared services
        services.AddSingleton<IEmailService, EmailService>();
        services.AddSingleton<INotificationService, NotificationService>();
        
        // Auto-register all slice-specific services
        services.Scan(scan => scan
            .FromAssemblyOf<RegisterUserHandler>()
            .AddClasses(classes => classes.InNamespaces("CritterPP.Features"))
            .AsImplementedInterfaces()
            .WithScopedLifetime());
            
        return services;
    }
}
```

## Specification Framework for Functional Core

### Command Specifications (Pure Function Testing)
```csharp
public class RegisterUserDeciderSpec
{
    [Fact]
    public void RegisterUser_WithValidCommand_ShouldGenerateUserRegisteredEvent()
    {
        // Given (Pure setup)
        var command = new RegisterUserCommand(
            TenantId.New(), 
            "user@example.com", 
            UserRole.Member);
        var initialState = UserState.Initial;

        // When (Pure function call)
        var result = UserDecider.Decide(command, initialState);

        // Then (Pure verification)
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1);
        
        var userRegistered = result.Value[0].Should().BeOfType<UserRegistered>().Subject;
        userRegistered.Email.Should().Be("user@example.com");
        userRegistered.Role.Should().Be(UserRole.Member);
    }

    [Fact]
    public void RegisterUser_WithInvalidEmail_ShouldReturnFailure()
    {
        // Given
        var command = new RegisterUserCommand(
            TenantId.New(), 
            "", 
            UserRole.Member);
        var initialState = UserState.Initial;

        // When
        var result = UserDecider.Decide(command, initialState);

        // Then
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be("Email is required");
    }

    [Fact]
    public void RegisterUser_WithActiveUser_ShouldReturnFailure()
    {
        // Given
        var command = new RegisterUserCommand(
            TenantId.New(), 
            "user@example.com", 
            UserRole.Member);
        var activeState = UserState.Initial with 
        { 
            Status = UserStatus.Active,
            Email = "user@example.com"
        };

        // When
        var result = UserDecider.Decide(command, activeState);

        // Then
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be("User already exists");
    }
}
```

### State Evolution Specifications
```csharp
public class UserEvolutionSpec
{
    [Fact]
    public void Evolve_WithUserRegistered_ShouldUpdateState()
    {
        // Given
        var initialState = UserState.Initial;
        var userRegistered = new UserRegistered(
            UserId.New(),
            TenantId.New(),
            "user@example.com",
            UserRole.Member,
            DateTimeOffset.UtcNow);

        // When
        var newState = UserEvolution.Evolve(initialState, userRegistered);

        // Then
        newState.Id.Should().Be(userRegistered.UserId);
        newState.Email.Should().Be("user@example.com");
        newState.Status.Should().Be(UserStatus.Active);
        newState.Role.Should().Be(UserRole.Member);
    }

    [Fact]
    public void Fold_WithEventSequence_ShouldBuildCorrectState()
    {
        // Given
        var userId = UserId.New();
        var events = new DomainEvent[]
        {
            new UserRegistered(userId, TenantId.New(), "user@example.com", UserRole.Member, DateTimeOffset.UtcNow),
            new UserUpdated(userId, "John", "Doe", "Developer", DateTimeOffset.UtcNow.AddMinutes(1))
        };

        // When
        var finalState = UserEvolution.Fold(events);

        // Then
        finalState.Id.Should().Be(userId);
        finalState.Email.Should().Be("user@example.com");
        finalState.FirstName.Should().Be("John");
        finalState.LastName.Should().Be("Doe");
        finalState.Title.Should().Be("Developer");
        finalState.Status.Should().Be(UserStatus.Active);
    }
}
```

### Integration Specifications (Imperative Shell)
```csharp
public class UserCommandHandlerSpec : IAsyncLifetime
{
    private readonly IDocumentSession _session;
    private readonly TestContext _context;

    public UserCommandHandlerSpec()
    {
        _context = new TestContext();
        _session = _context.Session;
    }

    [Fact]
    public async Task Handle_RegisterUser_ShouldStoreEventsAndReturnUserId()
    {
        // Given
        var command = new RegisterUserCommand(
            TenantId.New(), 
            "user@example.com", 
            UserRole.Member);

        // When
        var result = await UserCommandHandlers.Handle(
            command, _session, _context.ExecutionContext, CancellationToken.None);

        // Then
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBe(UserId.Empty);

        // Verify events were stored
        var stream = $"user-{command.Email.ToLowerInvariant()}";
        var events = await _session.Events.FetchStreamAsync(stream);
        events.Should().HaveCount(1);
        
        var userRegistered = events[0].Data.Should().BeOfType<UserRegistered>().Subject;
        userRegistered.Email.Should().Be("user@example.com");
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => _context.DisposeAsync().AsTask();
}
```

### View Specifications (Projection Testing)
```csharp
public class UserProjectionSpec
{
    [Fact]
    public void Create_WithUserRegistered_ShouldCreateProjection()
    {
        // Given
        var userRegistered = new UserRegistered(
            UserId.New(),
            TenantId.New(),
            "user@example.com",
            UserRole.Member,
            DateTimeOffset.UtcNow);

        var handler = new UserProjectionHandler();

        // When
        var projection = handler.Create(userRegistered);

        // Then
        projection.Should().NotBeNull();
        projection.Id.Should().Be(userRegistered.UserId.Value);
        projection.Email.Should().Be("user@example.com");
        projection.DisplayName.Should().Be("user@example.com");
        projection.Status.Should().Be(UserStatus.Active);
    }

    [Fact]
    public void Apply_WithUserUpdated_ShouldUpdateProjection()
    {
        // Given
        var userId = UserId.New();
        var existingProjection = new UserProjection(
            Id: userId.Value,
            TenantId: TenantId.New().Value,
            Email: "user@example.com",
            FirstName: string.Empty,
            LastName: string.Empty,
            DisplayName: "user@example.com",
            Role: UserRole.Member,
            Status: UserStatus.Active,
            CreatedAt: DateTimeOffset.UtcNow,
            LastModifiedAt: DateTimeOffset.UtcNow
        );

        var userUpdated = new UserUpdated(
            userId,
            "John",
            "Doe", 
            "Developer",
            DateTimeOffset.UtcNow.AddMinutes(1));

        var handler = new UserProjectionHandler();

        // When
        var updatedProjection = handler.Apply(userUpdated, existingProjection);

        // Then
        updatedProjection.FirstName.Should().Be("John");
        updatedProjection.LastName.Should().Be("Doe");
        updatedProjection.DisplayName.Should().Be("John Doe");
        updatedProjection.LastModifiedAt.Should().Be(userUpdated.UpdatedAt);
    }
}
```

## Agentic Code Generation

### Pattern Recognition
The system analyzes specifications to identify:
- **Command Patterns**: Input validation, business rules, event generation
- **Event Patterns**: State changes, side effects, projections
- **Query Patterns**: Filtering, sorting, pagination
- **Integration Patterns**: External service calls, notifications

### Code Templates
```csharp
// Generated Command Handler Template
public static {{EventType}} Handle(
    {{CommandType}} command,
    IDocumentSession session)
{
    {{#validations}}
    // Validation: {{description}}
    {{validationCode}}
    {{/validations}}

    {{#businessRules}}
    // Business Rule: {{description}}
    {{ruleCode}}
    {{/businessRules}}

    // Generate event
    return new {{EventType}}(
        {{#eventProperties}}
        {{propertyMapping}},
        {{/eventProperties}}
        DateTimeOffset.UtcNow);
}
```

### Generation Rules
1. **Command Validation**: Generate from Given preconditions
2. **Business Logic**: Extract from When conditions
3. **Event Generation**: Derive from Then assertions
4. **Side Effects**: Identify from additional Then clauses
5. **Error Handling**: Generate from negative test cases

## Migration Strategy

### Phase 1: Parallel Implementation
- Build event sourcing infrastructure alongside existing CRUD
- Implement dual-write pattern for critical aggregates
- Create read model projections from existing data

### Phase 2: Feature-by-Feature Migration
- Migrate individual features to event sourcing
- Maintain API compatibility through facade patterns
- Run parallel systems with data synchronization

### Phase 3: Complete Transition
- Switch all reads to projections
- Remove CRUD-based implementations
- Optimize event store and projections

### Data Migration Approach
```csharp
public class DataMigrationService
{
    public async Task MigrateUsersToEventStore()
    {
        var users = await _legacyRepo.GetAllUsers();
        
        foreach (var user in users)
        {
            var events = CreateEventHistoryFromUser(user);
            await _eventStore.AppendToStream(
                $"user-{user.Id}", 
                events);
        }
    }

    private IEnumerable<DomainEvent> CreateEventHistoryFromUser(LegacyUser user)
    {
        yield return new UserRegistered(
            user.Id, user.TenantId, user.Email, 
            user.Role, user.CreatedAt);
        
        if (user.FirstName != null)
            yield return new UserUpdated(
                user.Id, user.FirstName, user.LastName, 
                user.ModifiedAt);
        
        if (!user.IsActive)
            yield return new UserDeactivated(
                user.Id, user.DeactivatedAt);
    }
}
```

## Performance Considerations

### Event Store Optimization
- **Snapshotting**: Periodic aggregate snapshots for large streams
- **Stream Archiving**: Move old events to cold storage
- **Projection Caching**: Cache frequently accessed read models
- **Index Strategy**: Optimize PostgreSQL indexes for event queries

### Wolverine Performance
- **Static Code Generation**: Pre-compile handlers for maximum performance
- **Mediator Mode**: Lightweight configuration for simple use cases
- **Message Batching**: Process multiple messages efficiently
- **Connection Pooling**: Optimize database connection usage

## Security Architecture

### Event Store Security
- **Encryption at Rest**: PostgreSQL transparent data encryption
- **Event Encryption**: Sensitive data encryption in events
- **Access Control**: Row-level security for tenant isolation
- **Audit Trail**: Complete event history for compliance

### Command Authorization
```csharp
public static async Task<UserUpdated> Handle(
    UpdateUser command,
    IDocumentSession session,
    IExecutionContext context)
{
    // Tenant isolation
    if (context.TenantId != command.TenantId)
        throw new UnauthorizedAccessException();

    // Role-based authorization
    if (!context.User.HasRole(UserRole.Admin) && 
        context.UserId != command.UserId)
        throw new ForbiddenException();

    // Continue with business logic...
}
```

## Monitoring and Observability

### Event Store Metrics
- Stream growth rates
- Event processing latency
- Projection lag time
- Query performance

### Application Metrics
- Command processing time
- Event handler execution
- Projection rebuild performance
- Error rates by handler type

### Distributed Tracing
- End-to-end request tracing
- Event processing correlation
- Cross-service communication
- Performance bottleneck identification

## Testing Strategy

### Event Sourcing Tests
```csharp
[Test]
public void RegisterUser_WithValidData_GeneratesUserRegisteredEvent()
{
    // Given
    var command = new RegisterUser(
        TenantId.New, "user@example.com", UserRole.Member);
    
    // When
    var result = UserHandlers.Handle(command, _session);
    
    // Then
    result.Should().BeOfType<UserRegistered>();
    result.Email.Should().Be("user@example.com");
}

[Test]
public void UserProjection_AfterUserRegistered_CreatesUserView()
{
    // Given
    var @event = new UserRegistered(
        UserId.New, TenantId.New, "user@example.com", 
        UserRole.Member, DateTimeOffset.UtcNow);
    
    // When
    var projection = _handler.Create(@event);
    
    // Then
    projection.Email.Should().Be("user@example.com");
    projection.Status.Should().Be(UserStatus.Active);
}
```

### Integration Testing
- Event store integration tests
- Projection consistency tests
- Command/query integration tests
- End-to-end API tests

This architecture provides a robust foundation for building event-driven applications with excellent scalability, maintainability, and observability characteristics while enabling advanced features like agentic code generation.