# CritterPP Development Rules

## Core Architectural Rules

### Functional Core, Imperative Shell Pattern
1. **Functional Core MUST be pure**: No I/O, no async/await, no exceptions, no external dependencies
2. **Imperative Shell handles I/O**: All database operations, async calls, logging, and external services
3. **Clear separation**: Functional core and imperative shell must be clearly separated and identifiable
4. **Result types**: Domain logic returns `Result<T>` or `Result<T, TError>` instead of throwing exceptions

### Decider Pattern Rules
1. **Pure decision functions**: `Decide(command, state) -> Result<Event[]>`
2. **Pure evolution functions**: `Evolve(state, event) -> State`
3. **Immutable types**: All commands, events, and state types must be immutable records
4. **No side effects**: Decider functions must not produce any side effects

### Event Sourcing Rules
1. **Events are facts**: Events represent immutable facts that have occurred
2. **Events MUST be immutable**: Use records with init-only properties
3. **Event names in past tense**: UserRegistered, OrderPlaced, PaymentProcessed
4. **Complete event data**: Events must contain all data needed for projections
5. **Backward compatibility**: Events must maintain backward compatibility

## Code Organization Rules

### Project Structure
```
Domain/
├── Commands/           # Command types (immutable records)
├── Events/            # Event types (immutable records)
├── State/             # State types (immutable records)
├── Deciders/          # Pure decision functions
├── Evolution/         # Pure evolution functions
└── Validation/        # Pure validation functions

Application/
├── CommandHandlers/   # Wolverine command handlers (imperative shell)
├── EventHandlers/     # Wolverine event handlers (side effects)
├── QueryHandlers/     # Query handlers (imperative shell)
└── Projections/       # Marten projection handlers

Tests/
├── DeciderTests/      # Unit tests for pure functions
├── EvolutionTests/    # Unit tests for state evolution
├── IntegrationTests/  # Integration tests for handlers
└── ProjectionTests/   # Tests for projections
```

### Naming Conventions
1. **Commands**: Imperative present tense (RegisterUser, UpdateProfile)
2. **Events**: Past tense (UserRegistered, ProfileUpdated)
3. **State**: Noun form (UserState, OrderState)
4. **Deciders**: Static class with suffix "Decider" (UserDecider, OrderDecider)
5. **Evolution**: Static class with suffix "Evolution" (UserEvolution, OrderEvolution)

## Type System Rules

### Immutable Types
```csharp
// ✅ Correct - Immutable record
public record RegisterUserCommand(
    TenantId TenantId,
    string Email,
    UserRole Role
);

// ❌ Incorrect - Mutable class
public class RegisterUserCommand
{
    public TenantId TenantId { get; set; }
    public string Email { get; set; }
    public UserRole Role { get; set; }
}
```

### Result Types
```csharp
// ✅ Correct - Return Result type
public static Result<DomainEvent[]> Decide(
    RegisterUserCommand command,
    UserState state)
{
    if (string.IsNullOrEmpty(command.Email))
        return Result.Failure<DomainEvent[]>("Email is required");
    
    return Result.Success(new DomainEvent[] { /* events */ });
}

// ❌ Incorrect - Throw exceptions
public static DomainEvent[] Decide(
    RegisterUserCommand command,
    UserState state)
{
    if (string.IsNullOrEmpty(command.Email))
        throw new ArgumentException("Email is required");
    
    return new DomainEvent[] { /* events */ };
}
```

### State Evolution Rules
```csharp
// ✅ Correct - Pure function with record update
public static UserState Evolve(UserState state, DomainEvent @event)
{
    return @event switch
    {
        UserRegistered e => state with
        {
            Id = e.UserId,
            Email = e.Email,
            Status = UserStatus.Active
        },
        _ => state
    };
}

// ❌ Incorrect - Mutating state
public static UserState Evolve(UserState state, DomainEvent @event)
{
    switch (@event)
    {
        case UserRegistered e:
            state.Id = e.UserId;  // Mutation!
            state.Email = e.Email;
            break;
    }
    return state;
}
```

## Testing Rules

### Pure Function Testing
1. **No mocking**: Pure functions don't need mocks
2. **Fast execution**: Tests should run in milliseconds
3. **Deterministic**: Same input always produces same output
4. **Complete coverage**: Test all branches and edge cases

```csharp
// ✅ Correct - Pure function test
[Fact]
public void Decide_WithValidCommand_ShouldReturnEvents()
{
    // Given
    var command = new RegisterUserCommand(/* parameters */);
    var state = UserState.Initial;

    // When
    var result = UserDecider.Decide(command, state);

    // Then
    result.IsSuccess.Should().BeTrue();
    result.Value.Should().ContainSingle()
        .Which.Should().BeOfType<UserRegistered>();
}
```

### Integration Testing
1. **Test imperative shell**: Integration tests for I/O operations
2. **Use real database**: Test against real PostgreSQL (test containers)
3. **Async patterns**: Use async/await in integration tests
4. **Clean state**: Each test should have clean state

## Performance Rules

### Functional Core Optimization
1. **Avoid allocations**: Minimize object allocation in hot paths
2. **Use readonly**: Mark collections as readonly when possible
3. **Pattern matching**: Use pattern matching for performance
4. **Struct records**: Consider struct records for small types

### Event Store Optimization
1. **Stream design**: Design streams for optimal query patterns
2. **Snapshot strategy**: Implement snapshots for large streams
3. **Projection caching**: Cache frequently accessed projections
4. **Batch operations**: Batch multiple operations when possible

## Error Handling Rules

### Functional Core
1. **No exceptions**: Use Result types instead of exceptions
2. **Validation errors**: Return validation errors as Result.Failure
3. **Business rule violations**: Return business errors as Result.Failure
4. **Explicit errors**: Make all possible errors explicit in return types

### Imperative Shell
1. **Exception handling**: Handle all exceptions in imperative shell
2. **Logging**: Log errors with appropriate context
3. **Graceful degradation**: Handle failures gracefully when possible
4. **Circuit breakers**: Implement circuit breakers for external services

## Validation Rules

### Command Validation
```csharp
// ✅ Correct - Pure validation in decider
public static Result<DomainEvent[]> Decide(
    RegisterUserCommand command,
    UserState state)
{
    // Pure validation
    if (string.IsNullOrWhiteSpace(command.Email))
        return Result.Failure<DomainEvent[]>("Email is required");
    
    if (!IsValidEmail(command.Email))
        return Result.Failure<DomainEvent[]>("Invalid email format");
    
    // Business rule validation
    if (state.Status != UserStatus.Inactive)
        return Result.Failure<DomainEvent[]>("User already exists");
    
    // Continue with event generation...
}

private static bool IsValidEmail(string email) =>
    !string.IsNullOrWhiteSpace(email) && email.Contains('@');
```

### External Validation
```csharp
// ✅ Correct - External validation in imperative shell
public static async Task<Result<UserId>> Handle(
    RegisterUserCommand command,
    IDocumentSession session,
    IUserRepository userRepository,
    CancellationToken cancellationToken)
{
    // External validation (I/O operation)
    var existingUser = await userRepository
        .FindByEmailAsync(command.Email, cancellationToken);
    
    if (existingUser != null)
        return Result.Failure<UserId>("User with email already exists");
    
    // Load state and call pure decider
    var events = await session.Events.FetchStreamAsync(/* stream */);
    var currentState = UserEvolution.Fold(events.Cast<DomainEvent>());
    var result = UserDecider.Decide(command, currentState);
    
    // Handle result...
}
```

## Wolverine Integration Rules

### Command Handlers
1. **Async signatures**: All handlers should be async
2. **Cancellation tokens**: Support cancellation tokens
3. **Result types**: Return Result types from handlers
4. **Single responsibility**: One command per handler

### Event Handlers
1. **Idempotent**: Event handlers must be idempotent
2. **Side effects only**: Event handlers should only perform side effects
3. **Error isolation**: Don't let side effect failures affect main flow
4. **Compensation**: Implement compensation for failed side effects

## Marten Integration Rules

### Event Store Configuration
1. **Stream naming**: Use consistent stream naming conventions
2. **Event serialization**: Configure proper JSON serialization
3. **Indexes**: Create appropriate indexes for query performance
4. **Partitioning**: Consider partitioning for large event stores

### Projections
1. **Pure functions**: Projection handlers should be pure when possible
2. **Immutable projections**: Use immutable records for projections
3. **Incremental updates**: Design projections for incremental updates
4. **Rebuild capability**: Ensure projections can be rebuilt from events

## Documentation Rules

### Code Documentation
1. **XML comments**: Document public APIs with XML comments
2. **Business intent**: Explain business intent, not implementation
3. **Examples**: Provide examples for complex functions
4. **Specifications**: Link to business specifications where applicable

### Architecture Documentation
1. **Decision records**: Document architectural decisions
2. **Diagrams**: Create and maintain architecture diagrams
3. **Migration guides**: Document migration strategies
4. **Performance characteristics**: Document performance expectations

## Agentic Code Generation Rules

### Specification Format
1. **Given-When-Then**: Use consistent GWT format
2. **Declarative style**: Focus on what, not how
3. **Business language**: Use domain language, not technical terms
4. **Complete scenarios**: Cover all important business scenarios

### Code Generation
1. **Template consistency**: Use consistent code generation templates
2. **Type safety**: Generated code must be type-safe
3. **Test generation**: Generate tests alongside implementation
4. **Human review**: All generated code must be reviewed by humans

### Quality Gates
1. **Compilation**: Generated code must compile without errors
2. **Test coverage**: Generated tests must provide adequate coverage
3. **Performance**: Generated code must meet performance requirements
4. **Security**: Generated code must follow security best practices

## Security Rules

### Data Protection
1. **Event encryption**: Encrypt sensitive data in events
2. **PII handling**: Handle personally identifiable information carefully
3. **Access control**: Implement proper access control for streams
4. **Audit trails**: Maintain complete audit trails

### Authentication & Authorization
1. **Context validation**: Validate execution context in handlers
2. **Tenant isolation**: Ensure proper tenant isolation
3. **Role-based access**: Implement role-based access control
4. **Principle of least privilege**: Grant minimum necessary permissions

These rules ensure consistent, maintainable, and high-quality code that follows functional programming principles while leveraging the Critter Stack effectively.