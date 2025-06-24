# CritterPP Migration Plan

## Executive Summary

This document outlines the comprehensive migration plan for transforming PlatformPlatform from a CRUD-based architecture to an event-driven system using the Critter Stack (Marten + Wolverine). The migration is structured in 4 phases over 6-8 months with minimal disruption to existing operations.

## Migration Overview

### Approach: Strangler Fig Pattern
- **Parallel Development**: Build new event-driven features alongside existing CRUD system
- **Gradual Migration**: Migrate features incrementally with full rollback capability
- **Zero Downtime**: Maintain service availability throughout the migration
- **API Compatibility**: Preserve existing API contracts for seamless frontend integration

### Success Metrics
- **Zero Service Downtime**: 99.99% uptime maintained
- **Data Integrity**: 100% data consistency validation
- **Performance Parity**: Response times within 10% of current system
- **Feature Parity**: All existing functionality preserved
- **Team Velocity**: Development speed improvement within 3 months post-migration

## Phase 1: Foundation & Infrastructure (Weeks 1-6)

### Objectives
- Establish event sourcing infrastructure
- Set up PostgreSQL and Marten configuration
- Create base classes and shared kernel for event sourcing
- Implement monitoring and testing frameworks

### Week 1-2: Infrastructure Setup
```yaml
Tasks:
  - PostgreSQL Setup:
    - Deploy PostgreSQL cluster in Azure
    - Configure connection strings and security
    - Set up backup and recovery procedures
  - Marten Configuration:
    - Install Marten packages
    - Configure event store schema
    - Set up basic projections infrastructure
  - Wolverine Integration:
    - Install Wolverine packages
    - Configure message handlers
    - Set up DI container integration
```

### Week 3-4: Shared Kernel Development
```csharp
// New Event Sourcing Base Classes
public abstract record DomainEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;
    public string EventType { get; init; } = GetType().Name;
    public int Version { get; init; } = 1;
}

// Aggregate Base Class
public abstract class EventSourcedAggregate<TId>
{
    public TId Id { get; protected set; }
    public int Version { get; private set; }
    private readonly List<DomainEvent> _uncommittedEvents = new();

    public IReadOnlyList<DomainEvent> GetUncommittedEvents() 
        => _uncommittedEvents.AsReadOnly();

    protected void RaiseEvent(DomainEvent @event)
    {
        _uncommittedEvents.Add(@event);
        Apply(@event);
        Version++;
    }

    protected abstract void Apply(DomainEvent @event);
}
```

### Week 5-6: Testing Framework & Monitoring
```yaml
Testing Infrastructure:
  - Event sourcing test utilities
  - Specification test framework
  - Integration test setup
  - Performance benchmarking tools

Monitoring Setup:
  - Event store metrics collection
  - Wolverine performance monitoring
  - PostgreSQL query optimization
  - Application insights integration
```

### Deliverables
- ✅ PostgreSQL cluster operational
- ✅ Marten event store configured
- ✅ Wolverine message processing ready
- ✅ Shared kernel for event sourcing
- ✅ Testing and monitoring infrastructure
- ✅ CI/CD pipeline updates

## Phase 2: Proof of Concept Implementation (Weeks 7-12)

### Objectives
- Implement first feature using event sourcing
- Validate architecture decisions
- Establish patterns for agentic code generation
- Create migration tooling

### Week 7-8: User Management POC
```csharp
// Event Definitions
public record UserRegistered(
    UserId UserId,
    TenantId TenantId,
    string Email,
    UserRole Role,
    DateTimeOffset RegisteredAt) : DomainEvent;

public record UserProfileUpdated(
    UserId UserId,
    string FirstName,
    string LastName,
    string Title,
    DateTimeOffset UpdatedAt) : DomainEvent;

// Command Handler
public static class UserCommandHandlers
{
    public static UserRegistered Handle(
        RegisterUserCommand command,
        IDocumentSession session)
    {
        // Validation
        var existingUser = session.Query<UserProjection>()
            .Where(u => u.TenantId == command.TenantId && 
                       u.Email == command.Email)
            .FirstOrDefault();

        if (existingUser != null)
            throw new DomainException($"User with email {command.Email} already exists");

        // Generate event
        return new UserRegistered(
            UserId.New(),
            command.TenantId,
            command.Email.ToLowerInvariant(),
            command.Role,
            DateTimeOffset.UtcNow);
    }
}
```

### Week 9-10: Dual-Write Implementation
```csharp
public class HybridUserService
{
    private readonly ILegacyUserRepository _legacyRepo;
    private readonly IDocumentSession _martenSession;
    private readonly IMessageBus _messageBus;

    public async Task<UserId> RegisterUser(RegisterUserCommand command)
    {
        using var transaction = await _martenSession.BeginTransactionAsync();
        
        try
        {
            // 1. Legacy system write
            var legacyUser = await _legacyRepo.CreateUser(command);
            
            // 2. Event sourcing write
            var userRegistered = UserCommandHandlers.Handle(command, _martenSession);
            _martenSession.Events.Append(userRegistered.UserId.Value, userRegistered);
            
            // 3. Commit both
            await _martenSession.SaveChangesAsync();
            await transaction.CommitAsync();
            
            return userRegistered.UserId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
```

### Week 11-12: Specification Framework
```csharp
// Specification-Driven Test
public class RegisterUserSpecification
{
    [Given("A tenant exists")]
    public void GivenTenantExists()
    {
        _testTenant = new TenantBuilder()
            .WithId(TenantId.New())
            .WithName("Test Tenant")
            .Build();
        _testContext.AddTenant(_testTenant);
    }

    [Given("No user exists with email {email}")]
    public void GivenNoUserExistsWithEmail(string email)
    {
        // Ensure clean state
        _testContext.EnsureNoUserWithEmail(email);
    }

    [When("User registers with email {email} and role {role}")]
    public async Task WhenUserRegisters(string email, UserRole role)
    {
        var command = new RegisterUserCommand(_testTenant.Id, email, role);
        _result = await _handler.Handle(command);
    }

    [Then("UserRegistered event should be generated")]
    public void ThenUserRegisteredEventGenerated()
    {
        var events = _testContext.GetEvents<UserRegistered>();
        events.Should().HaveCount(1);
        events.First().Email.Should().Be(_expectedEmail);
    }

    [Then("User should appear in user list")]
    public async Task ThenUserShouldAppearInList()
    {
        var users = await _queryHandler.Handle(
            new GetUsersQuery(_testTenant.Id));
        users.Should().Contain(u => u.Email == _expectedEmail);
    }
}
```

### Deliverables
- ✅ User management implemented with event sourcing
- ✅ Dual-write pattern established
- ✅ Specification framework operational
- ✅ Data migration utilities
- ✅ Performance baseline established

## Phase 3: Core Features Migration (Weeks 13-20)

### Objectives
- Migrate all account management features
- Implement projection optimization
- Establish agentic code generation patterns
- Complete testing coverage

### Week 13-14: Tenant Management Migration
```csharp
// Tenant Events
public record TenantCreated(
    TenantId TenantId,
    string Name,
    string Domain,
    TenantStatus Status,
    DateTimeOffset CreatedAt) : DomainEvent;

public record TenantConfigurationUpdated(
    TenantId TenantId,
    Dictionary<string, object> Configuration,
    DateTimeOffset UpdatedAt) : DomainEvent;

// Aggregate
public class Tenant : EventSourcedAggregate<TenantId>
{
    public string Name { get; private set; }
    public string Domain { get; private set; }
    public TenantStatus Status { get; private set; }
    public Dictionary<string, object> Configuration { get; private set; }

    protected override void Apply(DomainEvent @event)
    {
        switch (@event)
        {
            case TenantCreated created:
                Id = created.TenantId;
                Name = created.Name;
                Domain = created.Domain;
                Status = created.Status;
                break;
            case TenantConfigurationUpdated updated:
                Configuration = updated.Configuration;
                break;
        }
    }
}
```

### Week 15-16: Authentication & Authorization Migration
```csharp
// Authentication Events
public record LoginAttempted(
    UserId UserId,
    string Email,
    string IpAddress,
    string UserAgent,
    DateTimeOffset AttemptedAt) : DomainEvent;

public record LoginSuccessful(
    UserId UserId,
    SessionId SessionId,
    DateTimeOffset LoginAt) : DomainEvent;

public record LoginFailed(
    UserId UserId,
    string Reason,
    DateTimeOffset FailedAt) : DomainEvent;

// Wolverine Saga for Authentication Flow
public class AuthenticationSaga
{
    public async Task Handle(LoginAttempted loginAttempt, ILogger logger)
    {
        logger.LogInformation("Login attempt for user {UserId}", loginAttempt.UserId);
        
        // Validate credentials and generate appropriate event
        // This would be generated from specifications
    }
}
```

### Week 17-18: Projection Optimization
```csharp
// Optimized User List Projection
public class UserListProjection : MultiStreamProjection<UserListItem, string>
{
    public UserListProjection()
    {
        Identity<UserRegistered>(x => x.UserId.Value);
        Identity<UserProfileUpdated>(x => x.UserId.Value);
        Identity<UserDeactivated>(x => x.UserId.Value);
        
        // Custom filtering for tenant isolation
        CustomGrouping(new TenantGrouper());
    }

    public UserListItem Create(UserRegistered @event) => new()
    {
        Id = @event.UserId.Value,
        TenantId = @event.TenantId.Value,
        Email = @event.Email,
        Role = @event.Role,
        Status = UserStatus.Active,
        CreatedAt = @event.RegisteredAt,
        LastActivityAt = @event.RegisteredAt
    };

    public UserListItem Apply(UserProfileUpdated @event, UserListItem current)
    {
        current.FirstName = @event.FirstName;
        current.LastName = @event.LastName;
        current.DisplayName = $"{@event.FirstName} {@event.LastName}";
        current.LastActivityAt = @event.UpdatedAt;
        return current;
    }
}
```

### Week 19-20: Agentic Code Generation Framework
```csharp
public class SpecificationCodeGenerator
{
    public string GenerateCommandHandler(CommandSpecification spec)
    {
        var template = @"
public static {{EventType}} Handle(
    {{CommandType}} command,
    IDocumentSession session)
{
    {{#Validations}}
    // {{Description}}
    {{ValidationCode}}
    {{/Validations}}

    {{#BusinessRules}}
    // {{Description}}  
    {{RuleCode}}
    {{/BusinessRules}}

    return new {{EventType}}(
        {{#EventProperties}}
        {{PropertyMapping}},
        {{/EventProperties}}
        DateTimeOffset.UtcNow);
}";

        return RenderTemplate(template, spec);
    }

    public string GenerateProjection(ViewSpecification spec)
    {
        // Generate projection code from view specifications
        // Implementation would analyze Given-Then patterns
    }
}
```

### Deliverables
- ✅ Complete account management migration
- ✅ Optimized projection performance
- ✅ Agentic code generation framework
- ✅ Full test coverage maintained

## Phase 4: System Optimization & Cutover (Weeks 21-24)

### Objectives
- Complete migration of all features
- Performance optimization and tuning
- Production cutover preparation
- Legacy system decommissioning

### Week 21: Back Office Migration
```yaml
Features to Migrate:
  - Administrative dashboards
  - Support ticket management
  - System monitoring views
  - Reporting and analytics

Implementation:
  - Event-driven admin commands
  - Real-time dashboard projections
  - Historical data analysis from events
  - Advanced querying capabilities
```

### Week 22: Performance Optimization
```csharp
// Event Store Optimization
public class EventStoreOptimization
{
    // Implement snapshotting for large aggregates
    public async Task CreateSnapshot<T>(string streamId, T aggregate)
    {
        var snapshot = new AggregateSnapshot<T>
        {
            StreamId = streamId,
            Version = aggregate.Version,
            Data = aggregate,
            CreatedAt = DateTimeOffset.UtcNow
        };
        
        await _session.Store(snapshot);
        await _session.SaveChangesAsync();
    }

    // Optimize projection rebuilds
    public async Task RebuildProjectionOptimized<T>()
    {
        await _daemon.RebuildProjection<T>(CancellationToken.None);
    }
}

// PostgreSQL Optimization
/*
-- Optimize event queries
CREATE INDEX CONCURRENTLY idx_events_stream_version 
ON mt_events (stream_id, version);

-- Optimize projection queries  
CREATE INDEX CONCURRENTLY idx_user_projection_tenant_status
ON user_projections (tenant_id, status);
*/
```

### Week 23: Production Cutover Preparation
```yaml
Cutover Checklist:
  - Data migration validation complete
  - Performance benchmarks met
  - All tests passing (unit, integration, E2E)
  - Monitoring and alerting configured
  - Rollback procedures tested
  - Team training completed
  - Documentation updated

Go/No-Go Criteria:
  - Zero critical bugs in migration pipeline
  - Performance within 5% of legacy system
  - All stakeholder sign-offs obtained
  - 24/7 support team availability
```

### Week 24: Production Cutover & Monitoring
```csharp
// Cutover Process
public class ProductionCutover
{
    public async Task ExecuteCutover()
    {
        // 1. Enable read-only mode on legacy system
        await _legacySystem.EnableReadOnlyMode();
        
        // 2. Final data synchronization
        await _migrationService.FinalSync();
        
        // 3. Switch traffic to new system
        await _loadBalancer.SwitchToNewSystem();
        
        // 4. Validate system health
        await _healthChecker.ValidateAllSystems();
        
        // 5. Enable monitoring alerts
        await _monitoring.EnableProductionAlerts();
    }

    public async Task RollbackIfNeeded()
    {
        // Immediate rollback to legacy system if issues detected
        await _loadBalancer.SwitchToLegacySystem();
        await _legacySystem.DisableReadOnlyMode();
    }
}
```

### Deliverables
- ✅ Complete system migration
- ✅ Performance optimization completed
- ✅ Production deployment successful
- ✅ Legacy system decommissioned
- ✅ Team training completed

## Risk Mitigation Strategies

### Data Migration Risks
```yaml
Risk: Data Loss During Migration
Mitigation:
  - Complete backup before migration
  - Incremental migration with validation
  - Parallel system operation during transition
  - Point-in-time recovery capabilities

Risk: Performance Degradation
Mitigation:
  - Extensive performance testing
  - Staged rollout with monitoring
  - Automatic rollback triggers
  - Capacity planning and scaling
```

### Technical Risks
```yaml
Risk: Event Store Corruption
Mitigation:
  - Regular event store backups
  - Event replay capabilities
  - Data integrity checks
  - Multi-region replication

Risk: Projection Inconsistency
Mitigation:
  - Projection rebuild capabilities
  - Consistency validation tools
  - Eventual consistency monitoring
  - Manual reconciliation procedures
```

## Post-Migration Activities

### Week 25-28: Stabilization & Optimization
- Monitor system performance and stability
- Fine-tune projections and queries
- Optimize agentic code generation
- Collect user feedback and iterate

### Month 7-8: Advanced Features
- Implement advanced event sourcing patterns
- Add temporal querying capabilities  
- Enhance agentic code generation
- Develop additional projections and views

## Success Validation

### Performance Metrics
```yaml
Response Time Targets:
  - Command processing: < 100ms (95th percentile)
  - Query processing: < 50ms (95th percentile)
  - Event processing: < 10ms (95th percentile)
  - Projection updates: < 1s (eventual consistency)

Throughput Targets:
  - Commands: 1000/second sustained
  - Queries: 5000/second sustained
  - Events: 10000/second peak
  - Concurrent users: 10000+
```

### Business Metrics
```yaml
Development Velocity:
  - Feature development time: -50%
  - Bug resolution time: -30%
  - Testing time: -40%
  - Deployment frequency: +100%

System Reliability:
  - Uptime: 99.99%
  - Data consistency: 100%
  - Recovery time: < 1 hour
  - Mean time to resolution: < 2 hours
```

## Resource Requirements

### Team Composition
- **Lead Architect**: 1.0 FTE (full engagement)
- **Senior Backend Developers**: 2.0 FTE  
- **Backend Developers**: 2.0 FTE
- **DevOps Engineers**: 1.0 FTE
- **QA Engineers**: 1.0 FTE
- **Technical Writer**: 0.5 FTE

### Infrastructure Costs
```yaml
Development Environment:
  - PostgreSQL cluster: $500/month
  - Development VMs: $1000/month
  - Monitoring tools: $300/month

Production Environment:
  - PostgreSQL cluster: $2000/month
  - Additional compute: $1500/month
  - Monitoring/logging: $500/month
```

This comprehensive migration plan ensures a smooth transition to the event-driven CritterPP architecture while maintaining system reliability and business continuity throughout the process.