using Projects;

var builder = DistributedApplication.CreateBuilder(args);

var sqlServerPassword = Environment.GetEnvironmentVariable("SQL_SERVER_PASSWORD");
var database = builder.AddSqlServerContainer("account-management-db", sqlServerPassword)
    .WithVolumeMount("sql-server-data", "/var/opt/mssql", VolumeMountType.Named)
    .AddDatabase("account-management");

var accountManagementApi = builder.AddProject<PlatformPlatform_AccountManagement_Api>("account-management-api")
    .WithReference(database);

builder.AddNpmApp("account-management-spa", "../account-management/WebApp", "dev")
    .WithReference(accountManagementApi);

builder.Build().Run();