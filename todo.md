# CritterPP Implementation Todo List

## 🎯 Current Sprint: Foundation & Project Setup (Weeks 1-4)

### Week 1-2: Project Structure & Base Infrastructure

#### ✅ Already Completed
- [x] Architecture documentation (`architecture.md`)
- [x] Project requirements (`project.md`, `prd.md`)
- [x] Implementation plan (`plan.md`)
- [x] Development rules (`rules.md`)
- [x] Changelog template (`changelog.md`)

#### 📋 **IMMEDIATE NEXT STEPS** (Priority Order)

#### 1. **Project Structure Setup** 
- [ ] **Create new CritterPP solution structure**
  ```
  CritterPP.sln
  ├── src/
  │   ├── Features/
  │   ├── SharedKernel/
  │   ├── Infrastructure/
  │   └── Web/
  ├── tests/
  │   ├── Features.Tests/
  │   ├── SharedKernel.Tests/
  │   └── Integration.Tests/
  └── docs/
  ```

#### 2. **Package Dependencies**
- [ ] **Create Directory.Packages.props with Critter Stack**
  ```xml
  <PackageVersion Include="Marten" Version="7.33.0" />
  <PackageVersion Include="Wolverine" Version="3.14.0" />
  <PackageVersion Include="Wolverine.Marten" Version="3.14.0" />
  <PackageVersion Include="Npgsql" Version="8.0.11" />
  ```

#### 3. **SharedKernel Base Types**
- [ ] **Create ICommand, IQuery, IEvent interfaces**
  ```csharp
  // SharedKernel/Commands/ICommand.cs
  public interface ICommand;
  
  // SharedKernel/Queries/IQuery.cs  
  public interface IQuery<TResult>;
  
  // SharedKernel/Events/IEvent.cs
  public interface IEvent;
  ```

#### 4. **Strongly-Typed IDs**
- [ ] **Implement base StronglyTypedId<T> class**
- [ ] **Create UserId, TenantId, SessionId types**
  ```csharp
  // SharedKernel/Domain/UserId.cs
  public record UserId(string Value) : StronglyTypedId<UserId>(Value)
  {
      public static UserId New() => new(Ulid.NewUlid().ToString());
      public static UserId Empty => new(string.Empty);
  }
  ```

#### 5. **Result Types**
- [ ] **Implement Result<T> and Result types for error handling**
  ```csharp
  // SharedKernel/Results/Result.cs
  public abstract record Result
  {
      public bool IsSuccess { get; init; }
      public bool IsFailure => !IsSuccess;
      public string Error { get; init; } = string.Empty;
  }
  ```

#### 6. **Local Development Environment**
- [ ] **Create docker-compose.yml for PostgreSQL**
- [ ] **Create appsettings.Development.json**
- [ ] **Set up connection strings for local development**

---

### Week 3-4: Wolverine & Marten Integration

#### 7. **Marten Configuration**
- [ ] **Create MartenConfiguration.cs**
  ```csharp
  // Infrastructure/Database/MartenConfiguration.cs
  public static class MartenConfiguration
  {
      public static void ConfigureEventStore(this StoreOptions options)
      {
          options.Events.StreamIdentity = StreamIdentity.AsString;
          options.Events.DatabaseSchemaName = "events";
          options.DatabaseSchemaName = "projections";
      }
  }
  ```

#### 8. **Wolverine Configuration** 
- [ ] **Create WolverineConfiguration.cs**
- [ ] **Set up code generation and discovery**
- [ ] **Configure AggregateHandler workflow**

#### 9. **Web Application Setup**
- [ ] **Create Program.cs with Wolverine + Marten**
- [ ] **Configure minimal APIs**
- [ ] **Set up dependency injection**

#### 10. **Testing Infrastructure**
- [ ] **Create test base classes**
- [ ] **Set up Testcontainers for PostgreSQL**
- [ ] **Create specification test framework**
- [ ] **Implement test data builders**

---

## 🔄 Next Sprint: First Vertical Slice (Weeks 5-8)

### Week 5-6: First Vertical Slice Foundation
- [ ] Create RegisterUser feature slice structure
- [ ] Implement UserState aggregate record
- [ ] Create basic user events (UserRegistered)
- [ ] Implement RegisterUser decider function

### Week 7-8: Complete User Feature Slices
- [ ] Add UpdateUserProfile slice (UpdateProfile command)
- [ ] Add DeactivateUser slice (DeactivateUser command)
- [ ] Implement user projections (UserSummary, UserDetails)
- [ ] Create query slices (GetUser, GetUserList)
- [ ] Add HTTP endpoints with minimal APIs
- [ ] Complete test coverage for all slices

---

## 🎨 Pattern Templates to Create

### **Command Template**
```csharp
// Features/{Slice}/Commands/{Command}.cs
public record {Command}(...) : ICommand;

public static class {Command}Handler
{
    public static {Event} Handle({Command} command, {State} currentState)
    {
        // Pure business logic
        return new {Event}(...);
    }
}
```

### **Event Template**
```csharp
// Features/{Slice}/Events/{Event}.cs
public record {Event}(...) : IEvent;
```

### **State Template**
```csharp
// Features/{Slice}/State/{State}.cs
public record {State}(...)
{
    public static {State} Initial => new(...);
    
    public {State} Apply({Event} @event) => this with
    {
        // Update properties
    };
}
```

### **Projection Template**
```csharp
// Features/{Slice}/Projections/{Projection}.cs
public record {Projection}(...);

public class {Projection}Handler : MultiStreamProjection<{Projection}, string>
{
    public {Projection} Create({Event} @event) => new(...);
    public {Projection} Apply({Event} @event, {Projection} current) => current with { ... };
}
```

---

## 🚀 Success Criteria for Week 1-4

### **Must Have** ✅
1. ✅ Complete VSA project structure with all folders
2. ✅ All package references installed and configured
3. ✅ SharedKernel base types implemented and tested
4. ✅ Local development environment running (PostgreSQL + app)
5. ✅ Basic Wolverine + Marten integration working

### **Should Have** 🎯
1. ✅ Comprehensive testing infrastructure
2. ✅ Code generation templates prepared
3. ✅ Documentation for development setup
4. ✅ CI/CD pipeline configured
5. ✅ Performance benchmarking tools ready

### **Could Have** 💡
1. Developer CLI utilities
2. Advanced debugging tools
3. Code quality analyzers
4. Automated code formatting
5. Integration with development tools

---

## 📊 Sprint Tracking

### **Week 1 Focus**
- Project structure and dependencies
- SharedKernel implementation
- Local development setup

### **Week 2 Focus** 
- Wolverine configuration
- Marten integration
- Basic web application

### **Week 3 Focus**
- Testing infrastructure
- Template creation
- Development tools

### **Week 4 Focus**
- End-to-end validation
- Documentation completion
- Sprint 2 preparation

---

## 🔗 Dependencies & Blockers

### **External Dependencies**
- PostgreSQL container availability
- .NET 9 SDK installation
- Package availability (Marten, Wolverine)

### **Internal Dependencies**
- Architecture decisions finalized ✅
- Development patterns agreed ✅
- Folder structure defined ✅

### **Potential Blockers**
- Package compatibility issues
- PostgreSQL connection problems
- Wolverine configuration complexity
- Marten event store setup challenges

---

**Next Action**: Start with creating the new solution structure and implementing SharedKernel base types.