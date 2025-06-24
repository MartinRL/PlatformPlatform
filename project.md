# CritterPP: Event-Driven Platform Transformation

## Project Overview

**Project Name**: CritterPP (Critter Platform Platform)  
**Duration**: 6-8 months  
**Status**: Planning Phase  
**Last Updated**: 2025-06-24

## Vision Statement

Transform PlatformPlatform from a traditional CRUD-based system to a modern **Vertical Slice Architecture** powered by the **Critter Stack** (Marten + Wolverine), implementing the **AggregateHandler workflow** for minimal ceremony code and enabling **agentic code generation** from business specifications.

## Business Objectives

### Primary Goals
- **Code Transformation**: Complete architectural transformation without operational concerns
- **Vertical Slice Architecture**: Reorganize code by business capabilities, not technical layers
- **Critter Stack Adoption**: Implement Wolverine AggregateHandler workflow with Marten event sourcing
- **Agentic Code Generation**: Enable AI-driven development from Given-When-Then specifications
- **Technology Stack Modernization**: 
  - SQL Server → PostgreSQL + Marten
  - MediatR + CRUD → Wolverine AggregateHandler + Event Sourcing
  - Layered Architecture → Vertical Slice Architecture

### Secondary Goals
- **Developer Productivity**: Reduce boilerplate through Wolverine's code generation
- **Code Quality**: Improve maintainability through clear vertical slice boundaries
- **Testing Excellence**: Leverage pure functions and event sourcing for superior testing
- **Performance**: Utilize Wolverine's static code generation for optimal runtime performance

## Technical Scope

### Core Transformations

#### 1. Architectural Pattern Shift
- **From**: Layered architecture with horizontal technical layers
- **To**: Vertical Slice Architecture organized by business capabilities
- **Impact**: Complete code reorganization and folder restructuring

#### 2. Event Sourcing Implementation
- **From**: SQL Server with EF Core CRUD operations
- **To**: PostgreSQL with Marten event sourcing and AggregateHandler workflow
- **Impact**: New persistence layer with immutable event streams

#### 3. Message Processing Transformation
- **From**: MediatR with manual handler registration and pipeline behaviors
- **To**: Wolverine AggregateHandler with automatic code generation
- **Impact**: Elimination of boilerplate code and improved performance

#### 4. Domain Model Evolution
- **From**: Mutable entities with behavior methods
- **To**: Immutable state records with pure Apply() functions
- **Impact**: New domain modeling approach with event-driven state evolution

#### 5. Testing Strategy Transformation
- **From**: Complex integration tests with database setup
- **To**: Fast unit tests for pure functions + targeted integration tests
- **Impact**: Faster test execution and better test isolation

### Code Transformation Scope

#### Vertical Slices to Create
- **UserManagement**: Complete user lifecycle (register, update, deactivate)
- **TenantManagement**: Tenant creation, configuration, and management  
- **Authentication**: Login, logout, session management, password reset
- **Notifications**: Email notifications and system alerts

#### Shared Components
- **SharedKernel**: Base types for events, commands, queries, and results
- **Infrastructure**: Marten configuration, Wolverine setup, web bootstrapping
- **Testing**: Test utilities and specification framework

### Components Out of Scope (No Changes)
- **Frontend Applications**: React SPAs continue to work with existing API contracts
- **Cloud Infrastructure**: Azure deployment configuration remains unchanged
- **CI/CD Pipelines**: GitHub Actions workflows remain the same
- **External Integrations**: Third-party service integrations unchanged

## Success Criteria

### Code Transformation Requirements
1. **Complete VSA Implementation**: All features organized as self-contained vertical slices
2. **Wolverine AggregateHandler Adoption**: All command processing uses AggregateHandler workflow
3. **Event Sourcing Integration**: Complete Marten event store implementation
4. **API Contract Preservation**: All HTTP endpoints maintain existing contracts
5. **Zero Regression**: All existing functionality works identically

### Quality Requirements
1. **Code Clarity**: Business logic clearly separated from infrastructure concerns
2. **Minimal Ceremony**: Reduced boilerplate through Wolverine code generation
3. **Test Performance**: Unit tests run in <100ms, full test suite in <30 seconds
4. **Documentation**: Complete architectural patterns and examples documented
5. **Maintainability**: New features can be added by following established patterns

### Technical Achievement Targets
1. **Vertical Slice Isolation**: Each slice can be developed and tested independently
2. **Pure Function Testing**: Business logic tested without external dependencies
3. **Event Store Performance**: Event persistence under 10ms for single events
4. **Code Generation**: 70% of boilerplate code eliminated through Wolverine
5. **Developer Onboarding**: New developers productive within 1 week using patterns

## Key Stakeholders

### Technical Team
- **Lead Architect**: System design and technical decisions
- **Backend Developers**: Implementation of event sourcing and Critter Stack
- **DevOps Engineers**: Infrastructure and deployment automation
- **QA Engineers**: Testing strategy and validation

### Business Team
- **Product Owner**: Feature requirements and acceptance criteria
- **Business Analysts**: Specification definition and validation
- **UX Designers**: Frontend integration and user experience

## Risk Assessment

### High Risk
- **Data Migration Complexity**: Converting existing relational data to event streams
- **Learning Curve**: Team adoption of event sourcing concepts
- **Third-party Dependencies**: Reliance on Marten and Wolverine ecosystem

### Medium Risk
- **Performance Unknowns**: Event sourcing performance characteristics
- **Integration Challenges**: Frontend and external system integration
- **Timeline Pressure**: Ambitious transformation timeline

### Low Risk
- **Infrastructure Changes**: Minimal cloud infrastructure modifications
- **API Compatibility**: Existing API contracts preserved
- **Development Tooling**: Familiar .NET development environment

## Next Steps

1. **Architecture Design**: Detailed technical architecture documentation
2. **Proof of Concept**: Small-scale implementation to validate approach
3. **Migration Strategy**: Phased migration plan with rollback procedures
4. **Team Training**: Critter Stack and event sourcing education
5. **Tooling Development**: Agentic code generation framework

## Related Documents

- [Architecture Documentation](architecture.md)
- [Migration Plan](plan.md)
- [Development Rules](rules.md)
- [Product Requirements](prd.md)
- [Change Log](changelog.md)