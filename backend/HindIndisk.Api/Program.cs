using HindIndisk.Api.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtSecret  = jwtSection["Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtSection["Issuer"],
            ValidAudience            = jwtSection["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew                = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// ── AutoMapper ────────────────────────────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// ── Application services ──────────────────────────────────────────────────────
builder.Services.AddScoped<HindIndisk.Api.Application.Services.IAuthService,
                           HindIndisk.Api.Application.Services.AuthService>();
builder.Services.AddScoped<HindIndisk.Api.Application.Services.IMenuService,
                           HindIndisk.Api.Application.Services.MenuService>();
builder.Services.AddScoped<HindIndisk.Api.Application.Services.ILocationService,
                           HindIndisk.Api.Application.Services.LocationService>();
builder.Services.AddScoped<HindIndisk.Api.Application.Services.IOrderService,
                           HindIndisk.Api.Application.Services.OrderService>();
builder.Services.AddScoped<HindIndisk.Api.Application.Services.IOfferService,
                           HindIndisk.Api.Application.Services.OfferService>();
builder.Services.AddScoped<HindIndisk.Api.Application.Services.IReservationService,
                           HindIndisk.Api.Application.Services.ReservationService>();
builder.Services.AddScoped<HindIndisk.Api.Application.Services.IAdminService,
                           HindIndisk.Api.Application.Services.AdminService>();
builder.Services.AddScoped<HindIndisk.Api.Application.Services.IAddressService,
                           HindIndisk.Api.Application.Services.AddressService>();

// ── Controllers ───────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// ── Swagger (with JWT bearer) ─────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "Hind Indisk API",
        Version     = "v1",
        Description = "REST API for Hind Indisk Restaurant — .NET 8 / MS SQL Server",
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Enter your JWT token (without the 'Bearer ' prefix).",
    };
    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Apply schema + seed ───────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    await db.Database.MigrateAsync();

    await DataSeeder.SeedAsync(db);
}

// ── Middleware pipeline ───────────────────────────────────────────────────────
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode  = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = "An unexpected error occurred." });
    });
});

// if (app.Environment.IsDevelopment())
//{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Hind Indisk API v1"));
//}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await app.RunAsync();
