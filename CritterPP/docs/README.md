# CritterPP - Functional Event Sourcing Architecture

## Project Structure

This is the new CritterPP implementation using **Vertical Slice Architecture (VSA)** with the **Critter Stack** (Marten + Wolverine) and **functional event sourcing patterns**.

### Directory Structure

```
CritterPP/
├── CritterPP.slnx                  # Modern solution file format
├── src/
│   ├── Features/                    # Vertical slices by specific operation
│   │   ├── Users/
│   │   │   ├── RegisterUser/       # Single command slice
│   │   │   ├── UpdateUserProfile/  # Single command slice
│   │   │   ├── DeactivateUser/     # Single command slice
│   │   │   ├── GetUser/            # Single query slice
│   │   │   └── GetUserList/        # Single query slice
│   │   ├── Tenants/
│   │   │   ├── CreateTenant/       # Single command slice
│   │   │   ├── UpdateTenant/       # Single command slice
│   │   │   └── GetTenant/          # Single query slice
│   │   └── Authentication/
│   │       ├── AuthenticateUser/   # Single command slice
│   │       └── RefreshToken/       # Single command slice
│   ├── SharedKernel/               # Cross-cutting concerns & base types
│   │   └── CritterPP.SharedKernel/ # Commands, Events, Results, IDs
│   ├── Infrastructure/             # Infrastructure configuration
│   │   └── CritterPP.Infrastructure/ # Marten, Wolverine, web setup
│   └── Web/                        # Web API entry point
│       └── CritterPP.Web/          # ASP.NET Core app with endpoints
├── tests/
│   ├── Features.Tests/             # Vertical slice tests
│   │   └── CritterPP.Features.Tests/ # Pure function & specification tests
│   ├── SharedKernel.Tests/         # SharedKernel tests
│   │   └── CritterPP.SharedKernel.Tests/ # Base type tests
│   └── Integration.Tests/          # Integration tests
│       └── CritterPP.Integration.Tests/ # Wolverine + Marten tests
└── docs/                           # Documentation
    └── README.md                   # This file
```

## Architecture Principles

### Functional Event Sourcing with Decider Pattern

**Three Core Patterns:**

1. **Command Processing (Decide Function)**
   ```
   Given: Current state
   When: Decide(command, state) is called
   Then: Zero or more events are produced (or Result.Failure)
   ```

2. **State Evolution (Evolve Function)**
   ```
   Given: Current state
   When: Evolve(state, event) is called
   Then: New state is returned
   ```

3. **View Projection (Aggregate/Fold)**
   ```
   Given: Sequence of events
   When: events.Aggregate(initial, evolve) is called
   Then: Final view state is produced
   ```

### Vertical Slice Architecture

Each feature slice contains:
- {FeatureName}.cs - Command definition, decider function, and events
- {EventName}.cs - Domain event definitions
- {EntityName}State.cs - Aggregate state records (shared across slices)
- {ViewName}Projection.cs - Read model projections
- {FeatureName}Specification.cs - Given-When-Then specifications
- Tests/ - Feature-specific tests

### Technology Stack

- **.NET 9.0** - Latest .NET runtime
- **Marten** - Event sourcing and document database
- **Wolverine** - Messaging and command/query handling
- **PostgreSQL** - Event store and read model storage
- **xUnit** - Testing framework
- **FluentAssertions** - Test assertions

## Next Steps

1. Set up package dependencies (Marten, Wolverine, etc.)
2. Implement SharedKernel base types
3. Create first vertical slice (RegisterUser)
4. Set up testing infrastructure
5. Configure Marten + Wolverine integration

## Related Documentation

- [Architecture](../architecture.md) - Overall architecture principles
- [Verification](../verification.md) - Testing strategy and patterns
- [Plan](../plan.md) - Implementation plan and phases