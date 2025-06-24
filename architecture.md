# CritterPP Architecture: Functional Event-Driven Design

## Architecture Overview

CritterPP transforms PlatformPlatform from a traditional CRUD-based system to a functional event-driven architecture using the Critter Stack (Marten + Wolverine) with PostgreSQL as the underlying database. The architecture follows the **Functional Core, Imperative Shell** pattern with the **Decider pattern** for pure domain logic.

## Core Architectural Principles

### Functional Core, Imperative Shell
- **Functional Core**: Pure domain logic without I/O, async/await, or exceptions
- **Imperative Shell**: Handles I/O, persistence, async operations, and error handling
- **Result Types**: Domain logic returns Result<T> instead of throwing exceptions
- **Immutable State**: All state transitions through pure functions

### Event Sourcing with Decider Pattern
- **Event Streams**: All business state changes captured as immutable events
- **Deciders**: Pure functions that decide events based on commands and current state
- **State Evolution**: Pure functions that evolve state from events
- **Projections**: Read models built from event streams for queries
- **Temporal Queries**: Point-in-time state reconstruction capabilities

### Command Query Responsibility Segregation (CQRS)
- **Commands**: Processed by pure decider functions in the functional core
- **Queries**: Read operations against projections handled by imperative shell
- **Separation**: Clear distinction between pure domain logic and I/O operations
- **Scalability**: Independent scaling of command processing and query handling

### Specification-Driven Development
- **Given-When-Then**: Behavioral specifications for decider functions
- **Event Specifications**: Expected events from command processing
- **View Specifications**: Read model requirements and validation
- **Agentic Generation**: AI code generation from functional specifications

## Technology Stack

### Data Persistence
```
PostgreSQL (Primary Database)
├── Marten (Event Store & Document DB)
│   ├── Event Streams (mt_events table)
│   ├── Projections (Generated read models)
│   └── Document Storage (Complex queries)
└── Event Store Schema
    ├── Stream Metadata
    ├── Event Metadata
    └── Projection State
```

### Application Framework
```
.NET 9 Application
├── Wolverine (Message Processing)
│   ├── Command Handlers (Aggregate workflows)
│   ├── Event Handlers (Side effects)
│   ├── Query Handlers (Read model access)
│   └── Saga Handlers (Long-running processes)
├── Marten (Persistence)
│   ├── Event Store Configuration
│   ├── Projection Definitions
│   └── Document Mappings
└── ASP.NET Core (Web Framework)
    ├── Minimal APIs (HTTP endpoints)
    ├── Middleware Pipeline
    └── Authentication/Authorization
```

## Functional Core Design

### Event Schema (Immutable Records)
```csharp
// Base event type - immutable and serializable
public abstract record DomainEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;
    public string EventType { get; init; } = GetType().Name;
    public int Version { get; init; } = 1;
}

// Domain events as immutable records
public record UserRegistered(
    UserId UserId,
    TenantId TenantId,
    string Email,
    UserRole Role,
    DateTimeOffset OccurredAt
) : DomainEvent;

public record UserUpdated(
    UserId UserId,
    string FirstName,
    string LastName,
    string Title,
    DateTimeOffset UpdatedAt
) : DomainEvent;
```

### Stream Naming Convention
- **User Streams**: `user-{userId}`
- **Tenant Streams**: `tenant-{tenantId}`
- **Authentication Streams**: `auth-{userId}`
- **System Streams**: `system-{feature}`

### Event Versioning Strategy
- **Upcasting**: Transform old event versions to new formats
- **Weak Schema**: Add optional properties without breaking changes
- **Version Metadata**: Track event schema versions
- **Migration Support**: Automated event transformation

## Decider Pattern Implementation

### State Types (Immutable Records)
```csharp
// User state - immutable record
public record UserState(
    UserId Id,
    TenantId TenantId,
    string Email,
    string FirstName,
    string LastName,
    string Title,
    UserRole Role,
    UserStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset LastModifiedAt
)
{
    public static UserState Initial => new(
        UserId.Empty,
        TenantId.Empty,
        string.Empty,
        string.Empty,
        string.Empty,
        string.Empty,
        UserRole.Member,
        UserStatus.Inactive,
        DateTimeOffset.MinValue,
        DateTimeOffset.MinValue
    );
}
```

### Command Types (Immutable Records)
```csharp
public record RegisterUserCommand(
    TenantId TenantId,
    string Email,
    UserRole Role
);

public record UpdateUserCommand(
    UserId UserId,
    string FirstName,
    string LastName,
    string Title
);
```

### Decider Functions (Pure Functions)
```csharp
public static class UserDecider
{
    // Pure function: Command + State -> Result<Event[]>
    public static Result<DomainEvent[]> Decide(
        object command,
        UserState state)
    {
        return command switch
        {
            RegisterUserCommand cmd => DecideRegisterUser(cmd, state),
            UpdateUserCommand cmd => DecideUpdateUser(cmd, state),
            _ => Result.Failure<DomainEvent[]>("Unknown command")
        };
    }

    // Pure decision function - no I/O, no exceptions
    private static Result<DomainEvent[]> DecideRegisterUser(
        RegisterUserCommand command,
        UserState state)
    {
        // Validation logic - pure functions only
        if (string.IsNullOrWhiteSpace(command.Email))
            return Result.Failure<DomainEvent[]>("Email is required");

        if (!IsValidEmail(command.Email))
            return Result.Failure<DomainEvent[]>("Invalid email format");

        if (state.Status != UserStatus.Inactive)
            return Result.Failure<DomainEvent[]>("User already exists");

        // Generate events - pure function
        var events = new DomainEvent[]
        {
            new UserRegistered(
                UserId.New(),
                command.TenantId,
                command.Email.ToLowerInvariant(),
                command.Role,
                DateTimeOffset.UtcNow
            )
        };

        return Result.Success(events);
    }

    private static Result<DomainEvent[]> DecideUpdateUser(
        UpdateUserCommand command,
        UserState state)
    {
        if (state.Status != UserStatus.Active)
            return Result.Failure<DomainEvent[]>("User must be active to update");

        if (string.IsNullOrWhiteSpace(command.FirstName))
            return Result.Failure<DomainEvent[]>("First name is required");

        var events = new DomainEvent[]
        {
            new UserUpdated(
                command.UserId,
                command.FirstName,
                command.LastName,
                command.Title,
                DateTimeOffset.UtcNow
            )
        };

        return Result.Success(events);
    }

    // Pure helper function
    private static bool IsValidEmail(string email) =>
        !string.IsNullOrWhiteSpace(email) && email.Contains('@');
}
```

### State Evolution (Pure Functions)
```csharp
public static class UserEvolution
{
    // Pure function: State + Event -> State
    public static UserState Evolve(UserState state, DomainEvent @event)
    {
        return @event switch
        {
            UserRegistered e => state with
            {
                Id = e.UserId,
                TenantId = e.TenantId,
                Email = e.Email,
                Role = e.Role,
                Status = UserStatus.Active,
                CreatedAt = e.OccurredAt,
                LastModifiedAt = e.OccurredAt
            },
            UserUpdated e => state with
            {
                FirstName = e.FirstName,
                LastName = e.LastName,
                Title = e.Title,
                LastModifiedAt = e.UpdatedAt
            },
            _ => state
        };
    }

    // Fold events into final state - pure function
    public static UserState Fold(IEnumerable<DomainEvent> events)
    {
        return events.Aggregate(UserState.Initial, Evolve);
    }
}
```

## Imperative Shell: Wolverine Integration

### Command Handlers (Imperative Shell)
```csharp
public static class UserCommandHandlers
{
    // Wolverine command handler - handles I/O and orchestration
    public static async Task<Result<UserId>> Handle(
        RegisterUserCommand command,
        IDocumentSession session,
        IExecutionContext context,
        CancellationToken cancellationToken)
    {
        // Load current state from event store (I/O operation)
        var stream = $"user-{command.Email.ToLowerInvariant()}";
        var events = await session.Events.FetchStreamAsync(stream, token: cancellationToken);
        var currentState = UserEvolution.Fold(events.Cast<DomainEvent>());

        // Call pure decider function (functional core)
        var result = UserDecider.Decide(command, currentState);
        
        if (result.IsFailure)
            return Result.Failure<UserId>(result.Error);

        // Store events (I/O operation)
        var newEvents = result.Value;
        session.Events.Append(stream, newEvents);
        await session.SaveChangesAsync(cancellationToken);

        // Extract UserId from first event
        var userRegistered = newEvents.OfType<UserRegistered>().FirstOrDefault();
        return userRegistered != null 
            ? Result.Success(userRegistered.UserId)
            : Result.Failure<UserId>("Failed to register user");
    }

    public static async Task<Result> Handle(
        UpdateUserCommand command,
        IDocumentSession session,
        CancellationToken cancellationToken)
    {
        // Load current state (I/O)
        var stream = $"user-{command.UserId.Value}";
        var events = await session.Events.FetchStreamAsync(stream, token: cancellationToken);
        var currentState = UserEvolution.Fold(events.Cast<DomainEvent>());

        // Call pure decider (functional core)
        var result = UserDecider.Decide(command, currentState);
        
        if (result.IsFailure)
            return Result.Failure(result.Error);

        // Store events (I/O)
        session.Events.Append(stream, result.Value);
        await session.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
```

### Event Handlers (Side Effects)
```csharp
public static class UserEventHandlers
{
    // Side effect handler - imperative shell
    public static async Task Handle(
        UserRegistered userRegistered,
        IEmailService emailService,
        ILogger<UserEventHandlers> logger)
    {
        try
        {
            await emailService.SendWelcomeEmailAsync(
                userRegistered.Email,
                userRegistered.UserId.Value);
                
            logger.LogInformation(
                "Welcome email sent to user {UserId}",
                userRegistered.UserId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to send welcome email to user {UserId}",
                userRegistered.UserId);
            // Don't rethrow - side effects should not fail the main flow
        }
    }

    public static async Task Handle(
        UserUpdated userUpdated,
        INotificationService notificationService)
    {
        await notificationService.NotifyProfileUpdatedAsync(userUpdated.UserId);
    }
}
```

## Projection Architecture (Imperative Shell)

### Read Model Projections
```csharp
// Immutable read model
public record UserProjection(
    string Id,
    string TenantId,
    string Email,
    string FirstName,
    string LastName,
    string DisplayName,
    UserRole Role,
    UserStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset LastModifiedAt
);

// Marten projection handler
public class UserProjectionHandler : MultiStreamProjection<UserProjection, string>
{
    public UserProjectionHandler()
    {
        Identity<UserRegistered>(x => x.UserId.Value);
        Identity<UserUpdated>(x => x.UserId.Value);
    }

    // Pure projection function
    public UserProjection Create(UserRegistered @event)
    {
        return new UserProjection(
            Id: @event.UserId.Value,
            TenantId: @event.TenantId.Value,
            Email: @event.Email,
            FirstName: string.Empty,
            LastName: string.Empty,
            DisplayName: @event.Email,
            Role: @event.Role,
            Status: UserStatus.Active,
            CreatedAt: @event.OccurredAt,
            LastModifiedAt: @event.OccurredAt
        );
    }

    // Pure projection function
    public UserProjection Apply(UserUpdated @event, UserProjection current)
    {
        return current with
        {
            FirstName = @event.FirstName,
            LastName = @event.LastName,
            DisplayName = $"{@event.FirstName} {@event.LastName}".Trim(),
            LastModifiedAt = @event.UpdatedAt
        };
    }
}
```

### Query Handlers (Imperative Shell)
```csharp
public static class UserQueryHandlers
{
    public static async Task<Result<UserProjection?>> Handle(
        GetUserQuery query,
        IDocumentSession session,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await session
                .Query<UserProjection>()
                .Where(u => u.Id == query.UserId.Value)
                .FirstOrDefaultAsync(cancellationToken);

            return Result.Success(user);
        }
        catch (Exception ex)
        {
            return Result.Failure<UserProjection?>(
                $"Failed to get user: {ex.Message}");
        }
    }

    public static async Task<Result<PagedResult<UserProjection>>> Handle(
        GetUsersQuery query,
        IDocumentSession session,
        CancellationToken cancellationToken)
    {
        try
        {
            var queryable = session.Query<UserProjection>()
                .Where(u => u.TenantId == query.TenantId.Value);

            if (!string.IsNullOrEmpty(query.SearchTerm))
            {
                queryable = queryable.Where(u => 
                    u.Email.Contains(query.SearchTerm) ||
                    u.DisplayName.Contains(query.SearchTerm));
            }

            var totalCount = await queryable.CountAsync(cancellationToken);
            
            var users = await queryable
                .OrderBy(u => u.CreatedAt)
                .Skip(query.Skip)
                .Take(query.Take)
                .ToListAsync(cancellationToken);

            var result = new PagedResult<UserProjection>(
                users, totalCount, query.Skip, query.Take);

            return Result.Success(result);
        }
        catch (Exception ex)
        {
            return Result.Failure<PagedResult<UserProjection>>(
                $"Failed to get users: {ex.Message}");
        }
    }
}
```

### Projection Types
1. **Inline Projections**: Real-time, ACID-compliant updates
2. **Async Projections**: Eventually consistent, high-performance
3. **Live Projections**: On-demand calculation from events using pure functions
4. **Custom Projections**: Complex business views and reports

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