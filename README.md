<p align="center">
  <i align="center">Kick-start the creation of production-ready multi-tenant SaaS solutions with enterprise-grade security 🚀</i>
</p>

<h4 align="center">

[![PlatformPlatform](https://github.com/platformplatform/PlatformPlatform/actions/workflows/application.yml/badge.svg)](https://github.com/platformplatform/PlatformPlatform/actions/workflows/application.yml?query=branch%3Amain)
[![GitHub issues with enhancement label](https://img.shields.io/github/issues-raw/platformplatform/PlatformPlatform/enhancement?label=enhancements&logo=github&color=%23A2EEEF)](https://github.com/orgs/PlatformPlatform/projects/1/views/3?filterQuery=-status%3A%22%E2%9C%85+Done%22+label%3Aenhancement)
[![GitHub issues with roadmap label](https://img.shields.io/github/issues-raw/platformplatform/PlatformPlatform/roadmap?label=roadmap&logo=github&color=%23006B75)](https://github.com/orgs/PlatformPlatform/projects/2/views/2?filterQuery=is%3Aopen+label%3Aroadmap)
[![GitHub issues with bug label](https://img.shields.io/github/issues-raw/platformplatform/PlatformPlatform/bug?label=bugs&logo=github&color=red)](https://github.com/platformplatform/PlatformPlatform/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=PlatformPlatform_platformplatform&metric=coverage)](https://sonarcloud.io/component_measures?id=PlatformPlatform_platformplatform&metric=coverage)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=PlatformPlatform_platformplatform&metric=alert_status)](https://sonarcloud.io/summary/overall?id=PlatformPlatform_platformplatform)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=PlatformPlatform_platformplatform&metric=security_rating)](https://sonarcloud.io/component_measures?id=PlatformPlatform_platformplatform&metric=Security)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=PlatformPlatform_platformplatform&metric=reliability_rating)](https://sonarcloud.io/component_measures?id=PlatformPlatform_platformplatform&metric=Reliability)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=PlatformPlatform_platformplatform&metric=sqale_rating)](https://sonarcloud.io/component_measures?id=PlatformPlatform_platformplatform&metric=Maintainability)

[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=PlatformPlatform_platformplatform&metric=code_smells)](https://sonarcloud.io/project/issues?id=PlatformPlatform_platformplatform&resolved=false&types=CODE_SMELL)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=PlatformPlatform_platformplatform&metric=vulnerabilities)](https://sonarcloud.io/project/issues?id=PlatformPlatform_platformplatform&resolved=false&types=VULNERABILITY)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=PlatformPlatform_platformplatform&metric=bugs)](https://sonarcloud.io/project/issues?id=PlatformPlatform_platformplatform&resolved=false&types=BUG)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=PlatformPlatform_platformplatform&metric=sqale_index)](https://sonarcloud.io/component_measures?id=PlatformPlatform_platformplatform&metric=sqale_index)

</h4>

## 👋 Welcome to PlatformPlatform

PlatformPlatform aims to showcase an end-to-end solution for building enterprise-grade multi-tenant application using Azure, .NET, React, Infrastructure as Code, GitHub workflows, and more. The roadmap includes features such as Single Sign-On (SSO), subscription management, usage tracking, feature flags, A/B testing, rate limiting, multi-region, disaster recovery, localization, accessibility, and much more. Follow the [continuously updated roadmap here](https://github.com/orgs/PlatformPlatform/projects/2/views/2).

Just getting off the ground, your star can help lift this higher! ⭐ Thanks!

## Getting started 

### Setting up Developer Environment with one command

For development on both Mac and Windows, all you need is [.NET](https://dotnet.microsoft.com), [.NET Aspire](https://learn.microsoft.com/en-us/dotnet/aspire/), [Docker Desktop](https://www.docker.com/products/docker-desktop/), [Node](https://nodejs.org/en), and [Yarn](https://yarnpkg.com/).

Then fork or clone this repository, install the [PlatformPlatform Developer CLI](/developer-cli/) called `pp` by running this command:

```bash
cd developer-cli
dotnet run install # IMPORTANT: Restart the terminal and run "pp --help" to get started
```

This will also set up your localhost with a SSL certificate for debugging, and a few environment variables.

When running the CLI, it will automatically detect changes and recompile, ensuring that it is always up to date. Also, this makes it a powerful way to build and share tools for your team.

Now spin up an SQL Server in Docker, the .NET Minimal API, and the React frontend with the following command:

```bash
pp run # The Aspire Dashboard and WebApp will automatically open in your browser when ready
```

To debug, just open the [PlatformPlatform.sln](/PlatformPlatform.sln) solution in [Rider](https://www.jetbrains.com/rider) or [Visual Studio](https://visualstudio.microsoft.com) and run the [AppHost](/application/AppHost/AppHost.csproj) project.

### Setting up CI/CD with passwordless deployments from GitHub to Azure in minutes

Run this command to automate Azure Subscription configuration and set up [GitHub Workflows](https://github.com/platformplatform/PlatformPlatform/actions) for deploying [Azure Infrastructure](/cloud-infrastructure/) (using Bicep) and compiling [application code](/application/) to Docker images deployed to Azure Container Apps:

```bash
pp configure-continuous-deployments # Tip: Add --verbose-logging to show the used CLI commands
```

You need to be the owner of the GitHub repository and the Azure Subscription, plus have permissions to create Service Principals and Active Directory Groups. You also need to have the [GitHub CLI](https://cli.github.com/) and the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed.

The command will first prompt you to login to Azure and GitHub, and collect information. You will be presented with a complete list of changes before they are applied. It will look something like this:

![Configure Continuous Deployments](https://platformplatformgithub.blob.core.windows.net/$root/ConfigureContinuousDeployments.png)

Except for adding a DNS record, everything is fully automated. After successful setup, the command will provide simple instructions on how to configure branch policies, Sonar Cloud static code analysis, and more.

The infrastructure is configured with auto-scaling and hosting costs in focus. It will cost less than 2 USD per day for a cluster, and it will allow scaling to millions of users 🎉

## Installing prerequisites

### Windows

Open a PowerShell terminal as Administrator and run the following commands:

- `wsl --install` (Windows Subsystem for Linux, required for Docker)
- Install [Chocolatey](https://chocolatey.org/install) 
- `choco install dotnet-sdk git docker-desktop nodejs azure-cli gh`
- `npm install --global yarn`
- `dotnet workload update` and `dotnet workload install aspire`

### Mac

Open a terminal and run the following commands:

- Install [Homebrew](https://brew.sh/).
- `brew install --cask dotnet-sdk`
- `brew install git docker node yarn azure-cli gh`
- `dotnet workload update` and `dotnet workload install aspire`

## Application Architecture

### .NET 8 backend with Clean Architecture, DDD, CQRS, Minimal API, and Aspire

The backend is built using the most popular, mature, and commonly used technologies in the .NET ecosystem:

- [.NET 8](https://dotnet.microsoft.com) and [C# 12](https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp)
- [.NET Aspire](https://aka.ms/dotnet-aspire)
- [ASP.NET Minimal API](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis)
- [Entity Framework](https://learn.microsoft.com/en-us/ef)
- [MediatR](https://github.com/jbogard/MediatR)
- [FluentValidation](https://fluentvalidation.net)
- [Mapster](https://github.com/MapsterMapper/Mapster)
- [XUnit](https://xunit.net), [FluentAssertions](https://fluentassertions.com), [NSubstitute](https://nsubstitute.github.io), and [Bogus](https://github.com/bchavez/Bogus)
- [SonarCloud](https://sonarcloud.io) and [JetBrains Code style and Cleanup](https://www.jetbrains.com/help/rider/Code_Style_Assistance.html)

<details>

<summary>Read more about the backend architecture</summary>

- **Clean Architecture**: The codebase is organized into layers that promote separation of concerns and maintainability.
- **Domain-Driven Design (DDD)**: DDD principles are applied to ensure a clear and expressive domain model.
- **Command Query Responsibility Segregation (CQRS)**: This clearly separates read (query) and write (command) operations, adhering to the single responsibility principle (each action is in a separate command).
- **Screaming architecture**: The architecture is designed with namespaces (folders) per feature, making the concepts easily visible and expressive, rather than organizing the code by types like models and repositories.
- **MediatR pipelines**: MediatR pipeline behaviors are used to ensure consistent handling of cross-cutting concerns like validation, unit of work, and handling of domain events.
- **Strongly Typed IDs**: The codebase uses strongly typed IDs, which are a combination of the entity type and the entity ID. This is even at the outer API layer, and Swagger translates this to the underlying contract. This ensures type safety and consistency across the codebase.
- **JetBrains Code style and Cleanup**: JetBrains Rider/ReSharper is used for code style and automatic cleanup (configured in `.editorconfig`), ensuring consistent code formatting. No need to discuss tabs vs. spaces anymore; Invalid formatting breaks the build.
- **Monolith prepared for self-contained systems**: The codebase is organized into a monolith, but the architecture is prepared for splitting in to self-contained systems. A self-contained system is a large microservice (or a small monolith) that contains the full stack including frontend, background jobs, etc. These can be developed, tested, deployed, and scaled in isolation, making it a good compromise between a large monolith and many small microservices. Unlike the popular backend-for-frontend (BFF) style with one shared frontend, this allows teams to work fully independently.
- **Shared Kernel**: The codebase uses a shared kernel for all the boilerplate code required to build a clean codebase. The shared kernel ensures consistency between self-contained systems, e.g., enforcing tenant isolation, auditing, tracking, implementation of tactical DDD patterns like aggregate, entities, repository base, ID generation, etc.

Although some features like authentication and multi-tenancy are not yet implemented, the current implementation serves as a solid foundation for building business logic without unnecessary boilerplate.

</details>

### React frontend with TypeScript, React Aria Components, and Node

The frontend is built with these technologies:

- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/react-aria-components.html)
- [Node](https://nodejs.org/en)

## Cloud Architecture

### Azure cloud infrastructure with enterprise-grade security and zero secrets

PlatformPlatform's cloud infrastructure is built using the latest Azure Platform as a Service (PaaS) technologies:

- [Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/overview)
- [Azure SQL](https://azure.microsoft.com/en-us/products/azure-sql)
- [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs)
- [Azure Service Bus](https://azure.microsoft.com/en-us/services/service-bus)
- [Azure Key Vault](https://azure.microsoft.com/en-us/services/key-vault)
- [Azure Application Insights](https://azure.microsoft.com/en-us/services/monitor)
- [Azure Log Analytics](https://azure.microsoft.com/en-us/services/monitor)
- [Azure Virtual Network](https://azure.microsoft.com/en-us/services/virtual-network)
- [Azure Managed Identities](https://docs.microsoft.com/en-us/azure/active-directory/lifecyclesmanaged-identities-azure-resources/overview)
- [Azure Container Registry](https://azure.microsoft.com/en-us/services/container-registry)
- [Microsoft Defender for Cloud](https://azure.microsoft.com/en-us/products/defender-for-cloud)

<details>

<summary>Read more about this enterprise-grade architecture</summary>

- **Platform as a Service (PaaS) technologies**: Azure is the leading Cloud Service Provider (CSP) when it comes to PaaS technologies. PlatformPlatform uses PaaS technologies which are fully managed by Microsoft, as opposed to Infrastructure as a Service (IaaS) technologies where the customer is responsible for the underlying infrastructure. This means that Microsoft is responsible for the availability of the infrastructure, and you are only responsible for the application and data. This makes it possible for even a small team to run a highly scalable, stable, and secure solution.
- **Enterprise-grade security with zero secrets**:
  - **Managed Identities**: No secrets are used when Container Apps connect to e.g. Databases, Blob Storage, and Service Bus. The infrastructure uses Managed Identities for all communication with Azure resources, eliminating the need for secrets.
  - **Federated credentials**: Deployment from GitHub to Azure is done using federated credentials, establishing a trust between the GitHub repository and Azure subscription based on the repository's URL, without the need for secrets.
  - **No secrets expires**: Since no secrets are used, there is no need to rotate secrets, and no risk of secrets expiring.
  - **100% Security Score**: The current infrastructure configuration follows best practices, and the current setup code achieves a 100% Security Score in Microsoft Defender for Cloud. This minimizes the attack surface and protects against even sophisticated attacks.
- **Automatic certificate management**: The infrastructure is configured to automatically request and renew SSL certificates from Let's Encrypt, eliminating the need for manual certificate management.
- **Multiple environments**: The setup includes different environments like Development, Staging, and Production, deployed into clearly named resource groups within a single Azure Subscription.
- **Multi-region**: Spinning up a cluster in a new region is a matter of adding one extra deployment job to the GitHub workflow. This allows customers to select a region where their data is close to the user and local data protection laws like GDPR, CCPA, etc. are followed.
- **Azure Container Apps**: The application is hosted using Azure Container Apps, which is a new service from Azure that provides a fully managed Kubernetes environment for running containerized applications. You don't need to be a Kubernetes expert to run your application in a scalable and secure environment.
- **Scaling from zero to millions of users**: The Azure Container App Environment is configured to scale from zero to millions of users, and the infrastructure is configured to scale automatically based on load. This means the starting costs are very low, and the solution can scale to millions of users without any manual intervention. This enables having Development and Staging environments running with very low costs.
- **Azure SQL**: The database is hosted using Azure SQL Database, which is a fully managed SQL Server instance. SQL Server is known for its high performance, stability, scalability, and security. The server will easily handle millions of users with single-digit millisecond response times.

</details>

### GitHub SDLC for passwordless deploying application and infrastructure in minutes

PlatformPlatform is built on a solid foundation for a modern software development lifecycle (SDLC):

- [GitHub Pull Requests](https://docs.github.com/en/pull-requests)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/quickstart-for-projects)
- [GitHub environments](https://docs.github.com/en/actions/reference/environments)
- [GitHub CODEOWNERS](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners)
- [GitHub Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Bash scripts](https://www.gnu.org/software/bash/)
- [Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview)

## Screenshots

This is how it looks when GitHub workflows has deployed Azure Infrastructure:

![GitHub Environments](https://platformplatformgithub.blob.core.windows.net/GitHubInfrastructureDeployments.png)

These are the resource groups created when deploying one staging cluster, and two production clusters:

![PlatformPlatform Resource Groups](https://platformplatformgithub.blob.core.windows.net/PlatformPlatformResourceGroups.png)

This is the security score after deploying PlatformPlatform resources to Azure. Achieving a 100% security score in Azure Defender for Cloud without exemptions is not trivial.

![Azure Security Recommendations](https://platformplatformgithub.blob.core.windows.net/AzureSecurityRecommendations.png)
