# CritterPP Verification & Testing Strategy

## Core Testing Principles: Three Fundamental Patterns

### Pattern 1: Command Processing (Decide Function)
**Every command slice MUST follow this exact pattern:**

```
Given: Current state  
When: Decide(command, state) is called
Then: Zero or more events are produced (or error)
```

### Pattern 2: State Evolution (Evolve Function)  
**Every state evolution MUST follow this exact pattern:**

```
Given: Current state
When: Evolve(state, event) is called  
Then: New state is returned
```

### Pattern 3: View Projection (Aggregate/Fold)
**Every view projection MUST follow this exact pattern:**

```
Given: Sequence of events
When: events.Aggregate(initial, evolve) is called
Then: Final view state is produced
```

These are the **fundamental verification patterns** for all business logic in CritterPP. Every test at every level must validate these state transitions.

### Examples of Pattern 1 (Command Processing with Decide):

**Scenario 1: Register New User**
- Given: `UserState.Initial` 
- When: `UserDecider.Decide(RegisterUser("john@email.com"), state)`
- Then: `[UserRegistered]` (1 event)

**Scenario 2: Register Existing User**
- Given: `UserState` with Status=Active
- When: `UserDecider.Decide(RegisterUser("john@email.com"), state)` 
- Then: `[]` (0 events, Result.Failure)

**Scenario 3: Update Active User**
- Given: `UserState` with Status=Active
- When: `UserDecider.Decide(UpdateProfile("John", "Doe"), state)`
- Then: `[UserProfileUpdated]` (1 event)

**Scenario 4: Complex Business Logic**
- Given: `UserState` with Role=Member
- When: `UserDecider.Decide(PromoteToAdmin(userId), state)`
- Then: `[UserRoleChanged, UserPermissionsGranted]` (2 events)

**Scenario 5: No-Op Command**
- Given: `UserState` with Role=Admin
- When: `UserDecider.Decide(PromoteToAdmin(userId), state)`
- Then: `[]` (0 events, no change needed)

### Examples of Pattern 2 (State Evolution with Evolve):

**Scenario 1: User Registration**
- Given: `UserState.Initial`
- When: `UserEvolution.Evolve(state, UserRegistered)` is called
- Then: `UserState` with Status=Active, email and role set

**Scenario 2: Profile Update**
- Given: `UserState` with firstName="John"
- When: `UserEvolution.Evolve(state, UserProfileUpdated)` is called
- Then: `UserState` with firstName="Jane" (updated)

**Scenario 3: User Deactivation**
- Given: `UserState` with Status=Active
- When: `UserEvolution.Evolve(state, UserDeactivated)` is called
- Then: `UserState` with Status=Inactive, deactivation timestamp

**Scenario 4: Role Change**
- Given: `UserState` with Role=Member
- When: `UserEvolution.Evolve(state, UserRoleChanged)` is called
- Then: `UserState` with Role=Admin

### Examples of Pattern 3 (View Projection with Aggregate):

**Scenario 1: User Summary View**
- Given: `[UserRegistered, UserProfileUpdated]` events
- When: `events.Aggregate(UserSummary.Initial, UserSummary.Evolve)`
- Then: `UserSummary` with name and email populated

**Scenario 2: User Activity View**
- Given: `[UserRegistered, UserLoggedIn, UserLoggedOut]` events  
- When: `events.Aggregate(UserActivity.Initial, UserActivity.Evolve)`
- Then: `UserActivity` with login sessions tracked

**Scenario 3: Complex View from Multiple Streams**
- Given: `[UserRegistered, TenantCreated, UserJoinedTenant]` events
- When: `events.Aggregate(TenantMembership.Initial, TenantMembership.Evolve)`
- Then: `TenantMembership` view with user-tenant relationships

**Scenario 4: Event Sequence Folding**
- Given: `[UserRegistered, ProfileUpdated, RoleChanged, UserDeactivated]`
- When: `events.Aggregate(UserState.Initial, (state, evt) => UserEvolution.Evolve(state, evt))`
- Then: Final `UserState` with all changes applied in sequence

## Testing Philosophy: Crystal Clear Verification

CritterPP uses a **multi-layered testing approach** that provides crystal clear verification at every level of the architecture. Each layer has specific testing patterns optimized for its concerns.

## Testing Pyramid for Event-Sourced Systems

```
                    ┌─────────────────────┐
                    │   E2E API Tests     │ ← Slow, Few
                    │   (Full System)     │
                    └─────────────────────┘
                  ┌───────────────────────────┐
                  │   Integration Tests       │ ← Medium Speed
                  │   (Wolverine + Marten)    │
                  └───────────────────────────┘
                ┌─────────────────────────────────┐
                │   Specification Tests           │ ← Fast, Many
                │   (Given-When-Then)             │
                └─────────────────────────────────┘
              ┌───────────────────────────────────────┐
              │   Pure Function Tests               │ ← Lightning Fast
              │   (Deciders & State Evolution)      │
              └───────────────────────────────────────┘
```

## Layer 1: Pure Function Tests (Lightning Fast)

**Purpose**: Test business logic in complete isolation
**Speed**: < 1ms per test
**Coverage**: 100% of business rules

### Core Patterns: Functional Event Sourcing with Decider

**Pattern 1: Command Processing (Decide Function)**
```
Given: Current state
When: Decide(command, state) is called
Then: Zero or more events are produced (or Result.Failure)
```

**Pattern 2: State Evolution (Evolve Function)**
```
Given: Current state
When: Evolve(state, event) is called
Then: New state is returned
```

**Pattern 3: View Projection (Aggregate/Fold)**
```
Given: Sequence of events
When: events.Aggregate(initial, evolve) is called
Then: Final view state is produced
```

### 1.1 Decider Function Tests (State + Command → Events)

```csharp
// Test file: Features/UserManagement/Tests/UserDeciderTests.cs
public class UserDeciderTests
{
    // Pattern: Given State + When Decide(command, state) → Then Events
    [Theory]
    [InlineData("valid@email.com", UserRole.Member, 1)] // → 1 event
    [InlineData("", UserRole.Member, 0)]                // → 0 events (error)
    [InlineData("invalid-email", UserRole.Member, 0)]   // → 0 events (error)
    public void Decide_GivenStateWhenRegisterCommand_ThenEventsOrError(
        string email, 
        UserRole role, 
        int expectedEventCount)
    {
        // Given - Current state
        var currentState = UserState.Initial;
        var command = new RegisterUser(TenantId.New(), email, role);

        // When - Decide function called (pure function)
        var result = UserDecider.Decide(command, currentState);

        // Then - 0..* events are produced or error
        if (expectedEventCount > 0)
        {
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().HaveCount(expectedEventCount);
            result.Value[0].Should().BeOfType<UserRegistered>()
                .Which.Email.Should().Be(email.ToLowerInvariant());
        }
        else
        {
            result.IsFailure.Should().BeTrue();
            result.Value.Should().BeEmpty();
            result.Error.Should().NotBeEmpty();
        }
    }

    [Fact]
    public void Decide_GivenActiveUserWhenRegisterCommand_ThenZeroEvents()
    {
        // Given - User already exists (Active state)
        var existingUserState = UserState.Initial with
        {
            Id = UserId.New(),
            TenantId = TenantId.New(),
            Email = "test@email.com",
            Status = UserStatus.Active,
            Role = UserRole.Member,
            CreatedAt = DateTimeOffset.UtcNow
        };
        var command = new RegisterUser(existingUserState.TenantId, "test@email.com", UserRole.Member);

        // When - Decide function called (pure function)
        var result = UserDecider.Decide(command, existingUserState);

        // Then - Zero events (error case)
        result.IsFailure.Should().BeTrue();
        result.Value.Should().BeEmpty(); // 0 events
        result.Error.Should().Be("User already exists with this email");
    }

    [Fact]
    public void Decide_GivenActiveUserWhenUpdateCommand_ThenOneEvent()
    {
        // Given - Active user state
        var activeUserState = CreateActiveUserState();
        var command = new UpdateUserProfile(activeUserState.Id, "John", "Doe", "Developer");

        // When - Decide function called (pure function)
        var result = UserDecider.Decide(command, activeUserState);

        // Then - One event produced
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1); // Exactly 1 event
        
        var profileUpdated = result.Value[0].Should().BeOfType<UserProfileUpdated>().Subject;
        profileUpdated.FirstName.Should().Be("John");
        profileUpdated.LastName.Should().Be("Doe");
        profileUpdated.Title.Should().Be("Developer");
    }

    [Fact]
    public void Decide_GivenActiveUserWhenDeactivateCommand_ThenOneEvent()
    {
        // Given - Active user state
        var activeUserState = CreateActiveUserState();
        var command = new DeactivateUser(activeUserState.Id, "Policy violation");

        // When - Decide function called (pure function)
        var result = UserDecider.Decide(command, activeUserState);

        // Then - One event produced
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(1); // Exactly 1 event
        
        var userDeactivated = result.Value[0].Should().BeOfType<UserDeactivated>().Subject;
        userDeactivated.UserId.Should().Be(activeUserState.Id);
        userDeactivated.Reason.Should().Be("Policy violation");
    }

    [Fact]
    public void Decide_GivenInactiveUserWhenDeactivateCommand_ThenZeroEvents()
    {
        // Given - Already inactive user state
        var inactiveUserState = CreateActiveUserState() with { Status = UserStatus.Inactive };
        var command = new DeactivateUser(inactiveUserState.Id, "Already inactive");

        // When - Decide function called (pure function)
        var result = UserDecider.Decide(command, inactiveUserState);

        // Then - Zero events (no-op case)
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty(); // 0 events - no change needed
    }

    // Test helper - pure function
    private static UserState CreateActiveUserState() => new(
        Id: UserId.New(),
        TenantId: TenantId.New(),
        Email: "test@email.com",
        Status: UserStatus.Active,
        Role: UserRole.Member,
        CreatedAt: DateTimeOffset.UtcNow);
}
```

### 1.2 State Evolution Tests (Evolve Function)

```csharp
// Test file: Features/UserManagement/Tests/UserStateEvolveTests.cs
public class UserStateEvolveTests
{
    [Fact]
    public void Evolve_GivenInitialStateWhenUserRegistered_ThenActiveUser()
    {
        // Given - Current state
        var currentState = UserState.Initial;
        var userRegistered = new UserRegistered(
            UserId: UserId.New(),
            TenantId: TenantId.New(),
            Email: "test@email.com",
            Role: UserRole.Member,
            OccurredAt: DateTimeOffset.UtcNow);

        // When - Evolve function called (pure function)
        var newState = UserEvolution.Evolve(currentState, userRegistered);

        // Then - New state produced
        newState.Id.Should().Be(userRegistered.UserId);
        newState.Email.Should().Be("test@email.com");
        newState.Status.Should().Be(UserStatus.Active);
        newState.Role.Should().Be(UserRole.Member);
        newState.CreatedAt.Should().Be(userRegistered.OccurredAt);
    }

    [Fact]
    public void Evolve_GivenActiveUserWhenProfileUpdated_ThenUpdatedProfile()
    {
        // Given - Current state
        var currentState = CreateActiveUserState();
        var profileUpdated = new UserProfileUpdated(
            UserId: currentState.Id,
            FirstName: "John",
            LastName: "Doe",
            Title: "Senior Developer",
            UpdatedAt: DateTimeOffset.UtcNow);

        // When - Evolve function called (pure function)
        var newState = UserEvolution.Evolve(currentState, profileUpdated);

        // Then
        newState.FirstName.Should().Be("John");
        newState.LastName.Should().Be("Doe");
        newState.Title.Should().Be("Senior Developer");
        newState.LastModifiedAt.Should().Be(profileUpdated.UpdatedAt);
        
        // Verify other fields unchanged
        newState.Id.Should().Be(currentState.Id);
        newState.Email.Should().Be(currentState.Email);
        newState.Status.Should().Be(currentState.Status);
    }

    [Fact]
    public void Fold_EventSequence_ShouldBuildCorrectFinalState()
    {
        // Given
        var userId = UserId.New();
        var tenantId = TenantId.New();
        var events = new DomainEvent[]
        {
            new UserRegistered(userId, tenantId, "test@email.com", UserRole.Member, DateTimeOffset.UtcNow),
            new UserProfileUpdated(userId, "John", "Doe", "Developer", DateTimeOffset.UtcNow.AddMinutes(5)),
            new UserRoleChanged(userId, UserRole.Admin, DateTimeOffset.UtcNow.AddMinutes(10))
        };

        // When
        var finalState = UserState.Fold(events);

        // Then
        finalState.Id.Should().Be(userId);
        finalState.Email.Should().Be("test@email.com");
        finalState.FirstName.Should().Be("John");
        finalState.LastName.Should().Be("Doe");
        finalState.Title.Should().Be("Developer");
        finalState.Role.Should().Be(UserRole.Admin);
        finalState.Status.Should().Be(UserStatus.Active);
    }

    private static UserState CreateActiveUserState() => new(
        Id: UserId.New(),
        TenantId: TenantId.New(),
        Email: "test@email.com",
        Status: UserStatus.Active,
        Role: UserRole.Member,
        CreatedAt: DateTimeOffset.UtcNow);
}
```

### 1.3 View Projection Tests (Aggregate/Fold Function)

```csharp
// Test file: Features/UserManagement/Tests/UserViewProjectionTests.cs
public class UserViewProjectionTests
{
    [Fact]
    public void Aggregate_GivenEventsWhenUserSummaryProjection_ThenCompleteView()
    {
        // Given - Sequence of events
        var userId = UserId.New();
        var events = new DomainEvent[]
        {
            new UserRegistered(userId, TenantId.New(), "john@test.com", UserRole.Member, DateTimeOffset.UtcNow),
            new UserProfileUpdated(userId, "John", "Doe", "Developer", DateTimeOffset.UtcNow.AddMinutes(1)),
            new UserRoleChanged(userId, UserRole.Admin, DateTimeOffset.UtcNow.AddMinutes(2))
        };

        // When - Aggregate/fold events into view (LINQ Aggregate = left fold)
        var userSummary = events.Aggregate(
            UserSummary.Initial, 
            (view, evt) => UserSummaryProjection.Evolve(view, evt));

        // Then - Final view state is produced
        userSummary.Id.Should().Be(userId.Value);
        userSummary.Email.Should().Be("john@test.com");
        userSummary.DisplayName.Should().Be("John Doe");
        userSummary.Role.Should().Be(UserRole.Admin);
        userSummary.Status.Should().Be(UserStatus.Active);
    }

    [Fact]
    public void Aggregate_GivenEventsWhenUserActivityProjection_ThenActivityHistory()
    {
        // Given - Activity events
        var userId = UserId.New();
        var events = new DomainEvent[]
        {
            new UserRegistered(userId, TenantId.New(), "test@user.com", UserRole.Member, DateTimeOffset.UtcNow),
            new UserLoggedIn(userId, "192.168.1.1", DateTimeOffset.UtcNow.AddHours(1)),
            new UserLoggedOut(userId, DateTimeOffset.UtcNow.AddHours(2)),
            new UserLoggedIn(userId, "192.168.1.2", DateTimeOffset.UtcNow.AddHours(3))
        };

        // When - Fold into activity view
        var userActivity = events.Aggregate(
            UserActivity.Initial,
            (view, evt) => UserActivityProjection.Evolve(view, evt));

        // Then - Activity view built correctly
        userActivity.UserId.Should().Be(userId.Value);
        userActivity.LoginSessions.Should().HaveCount(2);
        userActivity.CurrentlyLoggedIn.Should().BeTrue();
        userActivity.LastLoginAt.Should().BeAfter(userActivity.FirstLoginAt);
    }

    [Fact]
    public void Aggregate_GivenComplexEventsWhenTenantMembershipView_ThenCrossStreamView()
    {
        // Given - Events from multiple streams
        var userId = UserId.New();
        var tenantId = TenantId.New();
        var events = new DomainEvent[]
        {
            new UserRegistered(userId, tenantId, "member@tenant.com", UserRole.Member, DateTimeOffset.UtcNow),
            new TenantCreated(tenantId, "Acme Corp", "acme.com", DateTimeOffset.UtcNow),
            new UserJoinedTenant(userId, tenantId, UserRole.Admin, DateTimeOffset.UtcNow.AddMinutes(5)),
            new TenantSettingsUpdated(tenantId, new Dictionary<string, object> { ["Theme"] = "Dark" }, DateTimeOffset.UtcNow.AddMinutes(10))
        };

        // When - Aggregate cross-stream view
        var membership = events.Aggregate(
            TenantMembership.Initial,
            (view, evt) => TenantMembershipProjection.Evolve(view, evt));

        // Then - Complex view correctly built
        membership.UserId.Should().Be(userId.Value);
        membership.TenantId.Should().Be(tenantId.Value);
        membership.TenantName.Should().Be("Acme Corp");
        membership.UserRole.Should().Be(UserRole.Admin);
        membership.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Aggregate_GivenEventSequenceWhenPerformanceTracking_ThenEfficient()
    {
        // Given - Large sequence of events
        var userId = UserId.New();
        var events = Enumerable.Range(1, 1000)
            .Select(i => new UserActivityLogged(userId, $"Action {i}", DateTimeOffset.UtcNow.AddSeconds(i)))
            .Cast<DomainEvent>()
            .ToArray();

        var stopwatch = Stopwatch.StartNew();

        // When - Efficient aggregation
        var activityLog = events.Aggregate(
            UserActivityLog.Initial,
            (log, evt) => UserActivityLogProjection.Evolve(log, evt));

        stopwatch.Stop();

        // Then - Performance and correctness
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(10); // Fast aggregation
        activityLog.TotalActions.Should().Be(1000);
        activityLog.LastAction.Should().Be("Action 1000");
    }
}
```

## Layer 2: Specification Tests (Fast)

**Purpose**: Test business behavior end-to-end with Given-When-Then
**Speed**: < 100ms per test
**Coverage**: All business scenarios

### 2.1 Command Specification Tests

```csharp
// Test file: Features/UserManagement/Tests/RegisterUserSpecificationTests.cs
public class RegisterUserSpecificationTests : IAsyncLifetime
{
    private readonly TestContext _context;
    private readonly IDocumentSession _session;

    public RegisterUserSpecificationTests()
    {
        _context = new TestContext();
        _session = _context.Session;
    }

    [Fact]
    public async Task RegisterUser_HappyPath_ShouldSucceed()
    {
        // Given
        var tenantId = await GivenTenantExists("Acme Corp");
        await GivenNoUserExistsWithEmail("john@acme.com");

        // When
        var result = await WhenUserRegisters("john@acme.com", UserRole.Member, tenantId);

        // Then
        await ThenUserShouldExist("john@acme.com");
        await ThenUserRegisteredEventShouldBeGenerated("john@acme.com");
        await ThenWelcomeEmailShouldBeSent("john@acme.com");
    }

    [Fact]
    public async Task RegisterUser_DuplicateEmail_ShouldFail()
    {
        // Given
        var tenantId = await GivenTenantExists("Acme Corp");
        await GivenUserExistsWithEmail("john@acme.com", tenantId);

        // When & Then
        var exception = await Assert.ThrowsAsync<DomainException>(
            () => WhenUserRegisters("john@acme.com", UserRole.Member, tenantId));
        
        exception.Message.Should().Contain("already exists");
    }

    [Fact]
    public async Task RegisterUser_InvalidEmail_ShouldFail()
    {
        // Given
        var tenantId = await GivenTenantExists("Acme Corp");

        // When & Then
        var exception = await Assert.ThrowsAsync<DomainException>(
            () => WhenUserRegisters("invalid-email", UserRole.Member, tenantId));
        
        exception.Message.Should().Contain("Invalid email");
    }

    // Given methods - Setup test state
    private async Task<TenantId> GivenTenantExists(string name)
    {
        var tenantId = TenantId.New();
        var tenant = new TenantCreated(tenantId, name, $"{name.ToLower()}.com", DateTimeOffset.UtcNow);
        _session.Events.Append(tenantId.Value, tenant);
        await _session.SaveChangesAsync();
        return tenantId;
    }

    private async Task GivenNoUserExistsWithEmail(string email)
    {
        var existingUser = await _session.Query<UserSummary>()
            .Where(u => u.Email == email)
            .SingleOrDefaultAsync();
        existingUser.Should().BeNull();
    }

    private async Task GivenUserExistsWithEmail(string email, TenantId tenantId)
    {
        var userId = UserId.New();
        var userRegistered = new UserRegistered(userId, tenantId, email, UserRole.Member, DateTimeOffset.UtcNow);
        _session.Events.Append(userId.Value, userRegistered);
        await _session.SaveChangesAsync();
    }

    // When methods - Execute the action
    private async Task<UserId> WhenUserRegisters(string email, UserRole role, TenantId tenantId)
    {
        var command = new RegisterUser(tenantId, email, role);
        var handler = new RegisterUserHandler(_session, _context.Logger);
        return await handler.Handle(command, CancellationToken.None);
    }

    // Then methods - Verify outcomes
    private async Task ThenUserShouldExist(string email)
    {
        var user = await _session.Query<UserSummary>()
            .Where(u => u.Email == email)
            .SingleOrDefaultAsync();
        
        user.Should().NotBeNull();
        user.Email.Should().Be(email);
        user.Status.Should().Be(UserStatus.Active);
    }

    private async Task ThenUserRegisteredEventShouldBeGenerated(string email)
    {
        var events = await _session.Events.QueryAllRawEvents()
            .Where(e => e.EventType == typeof(UserRegistered))
            .ToListAsync();

        var userRegisteredEvent = events
            .Select(e => e.Data)
            .OfType<UserRegistered>()
            .SingleOrDefault(e => e.Email == email);

        userRegisteredEvent.Should().NotBeNull();
        userRegisteredEvent.Email.Should().Be(email);
    }

    private async Task ThenWelcomeEmailShouldBeSent(string email)
    {
        // Verify side effect occurred
        var emailsSent = _context.EmailService.SentEmails;
        emailsSent.Should().Contain(e => e.To == email && e.Subject.Contains("Welcome"));
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => _context.DisposeAsync().AsTask();
}
```

### 2.2 Query Specification Tests

```csharp
// Test file: Features/UserManagement/Tests/GetUserListSpecificationTests.cs
public class GetUserListSpecificationTests : IAsyncLifetime
{
    private readonly TestContext _context;
    private readonly IQuerySession _querySession;

    public GetUserListSpecificationTests()
    {
        _context = new TestContext();
        _querySession = _context.QuerySession;
    }

    [Fact]
    public async Task GetUserList_WithTenantFilter_ShouldReturnOnlyTenantUsers()
    {
        // Given
        var tenantA = TenantId.New();
        var tenantB = TenantId.New();
        
        await GivenUsersExist(new[]
        {
            ("user1@tenantA.com", tenantA),
            ("user2@tenantA.com", tenantA),
            ("user1@tenantB.com", tenantB)
        });

        // When
        var result = await WhenGetUserList(tenantA, skip: 0, take: 10);

        // Then
        result.Should().HaveCount(2);
        result.Should().OnlyContain(u => u.TenantId == tenantA.Value);
        result.Should().Contain(u => u.Email == "user1@tenantA.com");
        result.Should().Contain(u => u.Email == "user2@tenantA.com");
    }

    [Fact]
    public async Task GetUserList_WithPagination_ShouldReturnCorrectPage()
    {
        // Given
        var tenantId = TenantId.New();
        var users = Enumerable.Range(1, 25)
            .Select(i => ($"user{i:D2}@tenant.com", tenantId))
            .ToArray();
        
        await GivenUsersExist(users);

        // When
        var page1 = await WhenGetUserList(tenantId, skip: 0, take: 10);
        var page2 = await WhenGetUserList(tenantId, skip: 10, take: 10);
        var page3 = await WhenGetUserList(tenantId, skip: 20, take: 10);

        // Then
        page1.Should().HaveCount(10);
        page2.Should().HaveCount(10);
        page3.Should().HaveCount(5);
        
        // Verify no duplicates across pages
        var allEmails = page1.Concat(page2).Concat(page3).Select(u => u.Email).ToList();
        allEmails.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task GetUserList_OrderedByCreatedDate_ShouldReturnInCorrectOrder()
    {
        // Given
        var tenantId = TenantId.New();
        var baseTime = DateTimeOffset.UtcNow.AddDays(-10);
        
        await GivenUsersExistWithCreatedDates(new[]
        {
            ("user3@tenant.com", tenantId, baseTime.AddDays(2)),
            ("user1@tenant.com", tenantId, baseTime),
            ("user2@tenant.com", tenantId, baseTime.AddDays(1))
        });

        // When
        var result = await WhenGetUserList(tenantId, skip: 0, take: 10);

        // Then
        result.Should().HaveCount(3);
        result[0].Email.Should().Be("user1@tenant.com");
        result[1].Email.Should().Be("user2@tenant.com");
        result[2].Email.Should().Be("user3@tenant.com");
    }

    // Given methods
    private async Task GivenUsersExist((string email, TenantId tenantId)[] users)
    {
        foreach (var (email, tenantId) in users)
        {
            var userId = UserId.New();
            var userRegistered = new UserRegistered(
                userId, tenantId, email, UserRole.Member, DateTimeOffset.UtcNow);
            _context.Session.Events.Append(userId.Value, userRegistered);
        }
        await _context.Session.SaveChangesAsync();
    }

    private async Task GivenUsersExistWithCreatedDates(
        (string email, TenantId tenantId, DateTimeOffset createdAt)[] users)
    {
        foreach (var (email, tenantId, createdAt) in users)
        {
            var userId = UserId.New();
            var userRegistered = new UserRegistered(
                userId, tenantId, email, UserRole.Member, createdAt);
            _context.Session.Events.Append(userId.Value, userRegistered);
        }
        await _context.Session.SaveChangesAsync();
    }

    // When methods
    private async Task<IReadOnlyList<UserSummary>> WhenGetUserList(
        TenantId tenantId, int skip, int take)
    {
        var query = new GetUserList(tenantId, skip, take);
        var handler = new GetUserListHandler();
        return await handler.Handle(query, _querySession, CancellationToken.None);
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => _context.DisposeAsync().AsTask();
}
```

## Layer 3: Integration Tests (Medium Speed)

**Purpose**: Test Wolverine + Marten integration
**Speed**: < 1000ms per test
**Coverage**: All handler workflows

### 3.1 Wolverine Handler Integration Tests

```csharp
// Test file: Tests/Integration/WolverineHandlerIntegrationTests.cs
public class WolverineHandlerIntegrationTests : IAsyncLifetime
{
    private IHost _host;
    private IDocumentSession _session;
    private IMessageBus _messageBus;

    public async Task InitializeAsync()
    {
        _host = await Host.CreateDefaultBuilder()
            .UseWolverine(opts =>
            {
                opts.UseMartenEventSourcing(connectionString =>
                {
                    connectionString.ConnectionString(_context.Database.ConnectionString);
                    connectionString.Events.StreamIdentity = StreamIdentity.AsString;
                });
                opts.Discovery.IncludeAssembly(typeof(RegisterUserHandler).Assembly);
            })
            .StartAsync();

        _session = _host.Services.GetRequiredService<IDocumentSession>();
        _messageBus = _host.Services.GetRequiredService<IMessageBus>();
    }

    [Fact]
    public async Task RegisterUser_ThroughWolverine_ShouldProcessCompleteWorkflow()
    {
        // Given
        var command = new RegisterUser(
            TenantId.New(), 
            "integration@test.com", 
            UserRole.Member);

        // When
        var result = await _messageBus.InvokeAsync<UserRegistered>(command);

        // Then
        result.Should().NotBeNull();
        result.Email.Should().Be("integration@test.com");

        // Verify event was stored
        var events = await _session.Events.FetchStreamAsync(result.UserId.Value);
        events.Should().HaveCount(1);
        events[0].Data.Should().BeOfType<UserRegistered>();

        // Verify projection was updated
        var userSummary = await _session.Query<UserSummary>()
            .Where(u => u.Email == "integration@test.com")
            .SingleOrDefaultAsync();
        
        userSummary.Should().NotBeNull();
        userSummary.Status.Should().Be(UserStatus.Active);
    }

    [Fact]
    public async Task UpdateUserProfile_ThroughWolverine_ShouldUpdateProjection()
    {
        // Given - Create user first
        var registerCommand = new RegisterUser(
            TenantId.New(), 
            "update@test.com", 
            UserRole.Member);
        var registeredUser = await _messageBus.InvokeAsync<UserRegistered>(registerCommand);

        // When - Update profile
        var updateCommand = new UpdateUserProfile(
            registeredUser.UserId,
            "John",
            "Doe", 
            "Developer");
        var updatedEvent = await _messageBus.InvokeAsync<UserProfileUpdated>(updateCommand);

        // Then
        updatedEvent.Should().NotBeNull();
        updatedEvent.FirstName.Should().Be("John");

        // Verify projection was updated
        var userSummary = await _session.Query<UserSummary>()
            .Where(u => u.Id == registeredUser.UserId.Value)
            .SingleOrDefaultAsync();
        
        userSummary.DisplayName.Should().Be("John Doe");
    }

    [Fact]
    public async Task QueryHandler_ThroughWolverine_ShouldReturnCorrectResults()
    {
        // Given - Create some users
        var tenantId = TenantId.New();
        var userIds = new List<UserId>();
        
        for (int i = 1; i <= 3; i++)
        {
            var command = new RegisterUser(tenantId, $"user{i}@test.com", UserRole.Member);
            var result = await _messageBus.InvokeAsync<UserRegistered>(command);
            userIds.Add(result.UserId);
        }

        // When
        var query = new GetUserList(tenantId, skip: 0, take: 10);
        var users = await _messageBus.InvokeAsync<IReadOnlyList<UserSummary>>(query);

        // Then
        users.Should().HaveCount(3);
        users.Should().OnlyContain(u => u.TenantId == tenantId.Value);
    }

    public async Task DisposeAsync()
    {
        if (_host != null)
        {
            await _host.StopAsync();
            _host.Dispose();
        }
    }
}
```

### 3.2 Event Store Integration Tests

```csharp
// Test file: Tests/Integration/EventStoreIntegrationTests.cs
public class EventStoreIntegrationTests : IAsyncLifetime
{
    private readonly TestContext _context;
    private readonly IDocumentSession _session;

    public EventStoreIntegrationTests()
    {
        _context = new TestContext();
        _session = _context.Session;
    }

    [Fact]
    public async Task EventStore_StoreAndRetrieveEvents_ShouldMaintainEventOrder()
    {
        // Given
        var userId = UserId.New();
        var tenantId = TenantId.New();
        var events = new DomainEvent[]
        {
            new UserRegistered(userId, tenantId, "test@email.com", UserRole.Member, DateTimeOffset.UtcNow),
            new UserProfileUpdated(userId, "John", "Doe", "Developer", DateTimeOffset.UtcNow.AddMinutes(1)),
            new UserRoleChanged(userId, UserRole.Admin, DateTimeOffset.UtcNow.AddMinutes(2))
        };

        // When
        foreach (var evt in events)
        {
            _session.Events.Append(userId.Value, evt);
        }
        await _session.SaveChangesAsync();

        // Then
        var storedEvents = await _session.Events.FetchStreamAsync(userId.Value);
        storedEvents.Should().HaveCount(3);
        
        storedEvents[0].Data.Should().BeOfType<UserRegistered>();
        storedEvents[1].Data.Should().BeOfType<UserProfileUpdated>();
        storedEvents[2].Data.Should().BeOfType<UserRoleChanged>();
    }

    [Fact]
    public async Task EventStore_ConcurrentWrites_ShouldHandleOptimisticConcurrency()
    {
        // Given
        var userId = UserId.New();
        var session1 = _context.CreateSession();
        var session2 = _context.CreateSession();

        var event1 = new UserRegistered(userId, TenantId.New(), "test1@email.com", UserRole.Member, DateTimeOffset.UtcNow);
        var event2 = new UserRegistered(userId, TenantId.New(), "test2@email.com", UserRole.Member, DateTimeOffset.UtcNow);

        // When
        session1.Events.Append(userId.Value, event1);
        session2.Events.Append(userId.Value, event2);

        await session1.SaveChangesAsync();

        // Then
        var exception = await Assert.ThrowsAsync<ConcurrencyException>(
            () => session2.SaveChangesAsync());
        
        exception.Should().NotBeNull();
        
        // Verify only first event was stored
        var events = await _session.Events.FetchStreamAsync(userId.Value);
        events.Should().HaveCount(1);
        events[0].Data.Should().BeOfType<UserRegistered>();
        ((UserRegistered)events[0].Data).Email.Should().Be("test1@email.com");
    }

    [Fact]
    public async Task EventStore_LargeStream_ShouldHandleSnapshotting()
    {
        // Given
        var userId = UserId.New();
        var tenantId = TenantId.New();
        
        // Create initial user
        var userRegistered = new UserRegistered(userId, tenantId, "snapshot@test.com", UserRole.Member, DateTimeOffset.UtcNow);
        _session.Events.Append(userId.Value, userRegistered);
        await _session.SaveChangesAsync();

        // When - Generate many events
        for (int i = 0; i < 100; i++)
        {
            var profileUpdate = new UserProfileUpdated(
                userId, 
                $"First{i}", 
                $"Last{i}", 
                $"Title{i}", 
                DateTimeOffset.UtcNow.AddMinutes(i));
            _session.Events.Append(userId.Value, profileUpdate);
        }
        await _session.SaveChangesAsync();

        // Then - Should still be able to reconstruct state efficiently
        var finalState = await _session.Events.AggregateStreamAsync<UserState>(userId.Value);
        finalState.Should().NotBeNull();
        finalState.FirstName.Should().Be("First99");
        finalState.LastName.Should().Be("Last99");
        finalState.Title.Should().Be("Title99");
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => _context.DisposeAsync().AsTask();
}
```

## Layer 4: End-to-End API Tests (Slow)

**Purpose**: Test complete HTTP API workflows
**Speed**: < 5000ms per test
**Coverage**: Critical user journeys

### 4.1 API Integration Tests

```csharp
// Test file: Tests/EndToEnd/UserManagementApiTests.cs
public class UserManagementApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public UserManagementApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task RegisterUser_ValidRequest_ShouldReturn201AndCreateUser()
    {
        // Given
        var request = new
        {
            TenantId = TenantId.New().Value,
            Email = "api@test.com",
            Role = "Member"
        };

        // When
        var response = await _client.PostAsJsonAsync("/users", request);

        // Then
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var content = await response.Content.ReadFromJsonAsync<dynamic>();
        content.Should().NotBeNull();
        
        var userId = content.GetProperty("userId").GetString();
        userId.Should().NotBeNullOrEmpty();

        // Verify user was created
        var getResponse = await _client.GetAsync($"/users/{userId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var user = await getResponse.Content.ReadFromJsonAsync<UserSummary>();
        user.Email.Should().Be("api@test.com");
        user.Status.Should().Be(UserStatus.Active);
    }

    [Fact]
    public async Task RegisterUser_DuplicateEmail_ShouldReturn400()
    {
        // Given
        var tenantId = TenantId.New().Value;
        var email = "duplicate@test.com";
        
        var request = new
        {
            TenantId = tenantId,
            Email = email,
            Role = "Member"
        };

        // Create first user
        await _client.PostAsJsonAsync("/users", request);

        // When - Try to create duplicate
        var response = await _client.PostAsJsonAsync("/users", request);

        // Then
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var error = await response.Content.ReadAsStringAsync();
        error.Should().Contain("already exists");
    }

    [Fact]
    public async Task GetUserList_WithTenantFilter_ShouldReturnTenantUsers()
    {
        // Given
        var tenantId = TenantId.New().Value;
        var users = new[]
        {
            new { TenantId = tenantId, Email = "user1@tenant.com", Role = "Member" },
            new { TenantId = tenantId, Email = "user2@tenant.com", Role = "Admin" }
        };

        foreach (var user in users)
        {
            await _client.PostAsJsonAsync("/users", user);
        }

        // When
        var response = await _client.GetAsync($"/users?tenantId={tenantId}");

        // Then
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var userList = await response.Content.ReadFromJsonAsync<UserSummary[]>();
        userList.Should().HaveCount(2);
        userList.Should().OnlyContain(u => u.TenantId == tenantId);
    }

    [Fact]
    public async Task UpdateUserProfile_ValidRequest_ShouldReturn200AndUpdateUser()
    {
        // Given
        var createRequest = new
        {
            TenantId = TenantId.New().Value,
            Email = "update@test.com",
            Role = "Member"
        };
        
        var createResponse = await _client.PostAsJsonAsync("/users", createRequest);
        var createContent = await createResponse.Content.ReadFromJsonAsync<dynamic>();
        var userId = createContent.GetProperty("userId").GetString();

        var updateRequest = new
        {
            FirstName = "John",
            LastName = "Doe",
            Title = "Senior Developer"
        };

        // When
        var response = await _client.PutAsJsonAsync($"/users/{userId}", updateRequest);

        // Then
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify update
        var getResponse = await _client.GetAsync($"/users/{userId}");
        var user = await getResponse.Content.ReadFromJsonAsync<UserSummary>();
        
        user.DisplayName.Should().Be("John Doe");
    }

    [Fact]
    public async Task CompleteUserJourney_ShouldWorkEndToEnd()
    {
        // Given
        var tenantId = TenantId.New().Value;
        var email = "journey@test.com";

        // Step 1: Register user
        var registerRequest = new
        {
            TenantId = tenantId,
            Email = email,
            Role = "Member"
        };
        
        var registerResponse = await _client.PostAsJsonAsync("/users", registerRequest);
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var registerContent = await registerResponse.Content.ReadFromJsonAsync<dynamic>();
        var userId = registerContent.GetProperty("userId").GetString();

        // Step 2: Update profile
        var updateRequest = new
        {
            FirstName = "Journey",
            LastName = "Test",
            Title = "QA Engineer"
        };
        
        var updateResponse = await _client.PutAsJsonAsync($"/users/{userId}", updateRequest);
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Step 3: Verify in list
        var listResponse = await _client.GetAsync($"/users?tenantId={tenantId}");
        var users = await listResponse.Content.ReadFromJsonAsync<UserSummary[]>();
        
        users.Should().Contain(u => u.Email == email && u.DisplayName == "Journey Test");

        // Step 4: Get individual user
        var getResponse = await _client.GetAsync($"/users/{userId}");
        var user = await getResponse.Content.ReadFromJsonAsync<UserSummary>();
        
        user.Email.Should().Be(email);
        user.DisplayName.Should().Be("Journey Test");
        user.Status.Should().Be(UserStatus.Active);
    }
}
```

## Test Infrastructure & Utilities

### TestContext - Comprehensive Test Harness

```csharp
// Test file: Tests/Infrastructure/TestContext.cs
public class TestContext : IAsyncDisposable
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHost _host;
    private readonly IDocumentSession _session;
    private readonly IQuerySession _querySession;
    private readonly PostgreSqlContainer _database;

    public TestContext()
    {
        // Start PostgreSQL container
        _database = new PostgreSqlBuilder()
            .WithImage("postgres:15")
            .WithDatabase("critterpp_test")
            .WithUsername("test")
            .WithPassword("test")
            .Build();
        
        _database.StartAsync().GetAwaiter().GetResult();

        // Build test host
        _host = Host.CreateDefaultBuilder()
            .UseWolverine(opts =>
            {
                opts.UseMartenEventSourcing(connectionString =>
                {
                    connectionString.ConnectionString(_database.GetConnectionString());
                    connectionString.Events.StreamIdentity = StreamIdentity.AsString;
                    connectionString.AutoCreateSchemaObjects = AutoCreate.All;
                });
                opts.Discovery.IncludeAssembly(typeof(RegisterUserHandler).Assembly);
            })
            .ConfigureServices(services =>
            {
                services.AddSingleton<IEmailService, MockEmailService>();
                services.AddSingleton<INotificationService, MockNotificationService>();
            })
            .Build();

        _host.StartAsync().GetAwaiter().GetResult();

        _serviceProvider = _host.Services;
        _session = _serviceProvider.GetRequiredService<IDocumentSession>();
        _querySession = _serviceProvider.GetRequiredService<IQuerySession>();
        
        // Setup test data
        SetupTestDatabase().GetAwaiter().GetResult();
    }

    public IDocumentSession Session => _session;
    public IQuerySession QuerySession => _querySession;
    public IMessageBus MessageBus => _serviceProvider.GetRequiredService<IMessageBus>();
    public MockEmailService EmailService => (MockEmailService)_serviceProvider.GetRequiredService<IEmailService>();
    public MockNotificationService NotificationService => (MockNotificationService)_serviceProvider.GetRequiredService<INotificationService>();
    public ILogger<T> GetLogger<T>() => _serviceProvider.GetRequiredService<ILogger<T>>();

    public IDocumentSession CreateSession() => _serviceProvider.GetRequiredService<IDocumentStore>().OpenSession();

    private async Task SetupTestDatabase()
    {
        // Ensure database is ready
        await _session.SaveChangesAsync();
        
        // Clear any existing data
        await _session.DeleteWhere<UserSummary>(u => true);
        await _session.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        _session?.Dispose();
        _querySession?.Dispose();
        
        if (_host != null)
        {
            await _host.StopAsync();
            _host.Dispose();
        }
        
        if (_database != null)
        {
            await _database.DisposeAsync();
        }
    }
}
```

### Mock Services for Testing

```csharp
// Test file: Tests/Infrastructure/MockEmailService.cs
public class MockEmailService : IEmailService
{
    private readonly List<SentEmail> _sentEmails = new();

    public IReadOnlyList<SentEmail> SentEmails => _sentEmails.AsReadOnly();

    public Task SendWelcomeEmailAsync(string email, string message)
    {
        _sentEmails.Add(new SentEmail(email, "Welcome", message, DateTimeOffset.UtcNow));
        return Task.CompletedTask;
    }

    public Task SendNotificationEmailAsync(string email, string subject, string message)
    {
        _sentEmails.Add(new SentEmail(email, subject, message, DateTimeOffset.UtcNow));
        return Task.CompletedTask;
    }

    public void Clear() => _sentEmails.Clear();
}

public record SentEmail(string To, string Subject, string Body, DateTimeOffset SentAt);
```

## Test Data Builders

```csharp
// Test file: Tests/Builders/UserBuilder.cs
public class UserBuilder
{
    private UserId _userId = UserId.New();
    private TenantId _tenantId = TenantId.New();
    private string _email = "test@example.com";
    private string _firstName = "Test";
    private string _lastName = "User";
    private string _title = "Developer";
    private UserRole _role = UserRole.Member;
    private UserStatus _status = UserStatus.Active;
    private DateTimeOffset _createdAt = DateTimeOffset.UtcNow;

    public UserBuilder WithId(UserId userId)
    {
        _userId = userId;
        return this;
    }

    public UserBuilder WithTenant(TenantId tenantId)
    {
        _tenantId = tenantId;
        return this;
    }

    public UserBuilder WithEmail(string email)
    {
        _email = email;
        return this;
    }

    public UserBuilder WithName(string firstName, string lastName)
    {
        _firstName = firstName;
        _lastName = lastName;
        return this;
    }

    public UserBuilder WithRole(UserRole role)
    {
        _role = role;
        return this;
    }

    public UserBuilder WithStatus(UserStatus status)
    {
        _status = status;
        return this;
    }

    public UserBuilder CreatedAt(DateTimeOffset createdAt)
    {
        _createdAt = createdAt;
        return this;
    }

    public UserState BuildState() => new(
        Id: _userId,
        TenantId: _tenantId,
        Email: _email,
        FirstName: _firstName,
        LastName: _lastName,
        Title: _title,
        Role: _role,
        Status: _status,
        CreatedAt: _createdAt);

    public async Task<UserId> BuildAndSave(IDocumentSession session)
    {
        var userRegistered = new UserRegistered(_userId, _tenantId, _email, _role, _createdAt);
        session.Events.Append(_userId.Value, userRegistered);
        
        if (_firstName != "Test" || _lastName != "User")
        {
            var profileUpdated = new UserProfileUpdated(_userId, _firstName, _lastName, _title, _createdAt.AddMinutes(1));
            session.Events.Append(_userId.Value, profileUpdated);
        }
        
        await session.SaveChangesAsync();
        return _userId;
    }
}
```

## Performance Testing

```csharp
// Test file: Tests/Performance/UserManagementPerformanceTests.cs
public class UserManagementPerformanceTests : IAsyncLifetime
{
    private readonly TestContext _context;
    private readonly IMessageBus _messageBus;

    public UserManagementPerformanceTests()
    {
        _context = new TestContext();
        _messageBus = _context.MessageBus;
    }

    [Fact]
    public async Task RegisterUser_Performance_ShouldCompleteWithin100ms()
    {
        // Given
        var command = new RegisterUser(TenantId.New(), "perf@test.com", UserRole.Member);
        var stopwatch = Stopwatch.StartNew();

        // When
        var result = await _messageBus.InvokeAsync<UserRegistered>(command);

        // Then
        stopwatch.Stop();
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(100);
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task RegisterUser_Throughput_ShouldHandle100RequestsPerSecond()
    {
        // Given
        var tenantId = TenantId.New();
        var tasks = new List<Task<UserRegistered>>();
        var stopwatch = Stopwatch.StartNew();

        // When
        for (int i = 0; i < 100; i++)
        {
            var command = new RegisterUser(tenantId, $"perf{i}@test.com", UserRole.Member);
            tasks.Add(_messageBus.InvokeAsync<UserRegistered>(command));
        }

        var results = await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Then
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000);
        results.Should().HaveCount(100);
        results.Should().OnlyContain(r => r != null);
    }

    [Fact]
    public async Task GetUserList_Performance_ShouldCompleteWithin50ms()
    {
        // Given
        var tenantId = TenantId.New();
        
        // Create 100 users
        for (int i = 0; i < 100; i++)
        {
            var command = new RegisterUser(tenantId, $"list{i}@test.com", UserRole.Member);
            await _messageBus.InvokeAsync<UserRegistered>(command);
        }

        var query = new GetUserList(tenantId, 0, 50);
        var stopwatch = Stopwatch.StartNew();

        // When
        var result = await _messageBus.InvokeAsync<IReadOnlyList<UserSummary>>(query);

        // Then
        stopwatch.Stop();
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(50);
        result.Should().HaveCount(50);
    }

    public Task InitializeAsync() => Task.CompletedTask;
    public Task DisposeAsync() => _context.DisposeAsync().AsTask();
}
```

## Test Execution Strategy

### Parallel Test Execution

```csharp
// Test file: Tests/xunit.runner.json
{
  "parallelizeAssembly": true,
  "parallelizeTestCollections": true,
  "maxParallelThreads": 8,
  "preEnumerateTheories": false
}
```

### Test Categories

```csharp
// Test attributes for test categorization
[Trait("Category", "Unit")]        // Pure function tests
[Trait("Category", "Specification")] // Given-When-Then tests
[Trait("Category", "Integration")]  // Integration tests
[Trait("Category", "EndToEnd")]     // API tests
[Trait("Category", "Performance")]  // Performance tests
```

### Test Execution Commands

```bash
# Run all tests
dotnet test

# Run only unit tests (fastest)
dotnet test --filter Category=Unit

# Run specification tests
dotnet test --filter Category=Specification

# Run integration tests
dotnet test --filter Category=Integration

# Run performance tests
dotnet test --filter Category=Performance

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## Verification Checklist

### ✅ Pure Function Tests
- [ ] All decider functions have complete test coverage
- [ ] All state evolution functions are tested
- [ ] All business rules are tested with positive and negative cases
- [ ] Edge cases and boundary conditions are covered
- [ ] Tests run in < 1ms each

### ✅ Specification Tests  
- [ ] All commands have Given-When-Then specifications
- [ ] All queries have behavior specifications
- [ ] All side effects are verified
- [ ] Error conditions are tested
- [ ] Tests run in < 100ms each

### ✅ Integration Tests
- [ ] All Wolverine handlers are integration tested
- [ ] Event store operations are tested
- [ ] Projection updates are verified
- [ ] Concurrency scenarios are tested
- [ ] Tests run in < 1000ms each

### ✅ End-to-End Tests
- [ ] Complete user journeys are tested
- [ ] API contracts are verified
- [ ] Error responses are tested
- [ ] Authentication/authorization is tested
- [ ] Tests run in < 5000ms each

### ✅ Performance Tests
- [ ] Throughput requirements are verified
- [ ] Response time requirements are met
- [ ] Memory usage is within limits
- [ ] Concurrent user scenarios are tested
- [ ] Load testing is performed

This comprehensive testing strategy ensures crystal clear verification at every level of the CritterPP architecture, from pure business logic to complete system integration.