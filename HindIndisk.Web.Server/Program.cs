using System.Text;
using HindIndisk.Api.Application.Services;
using HindIndisk.Api.Hubs;
using HindIndisk.Api.Infrastructure;
using HindIndisk.Api.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace HindIndisk.Web.Server
{
	public class Program
	{
		public static async Task Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);

			// Add services to the container.
			var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins")
						.Get<string[]>() ?? ["https://localhost:58655"];

			builder.Services.AddCors(options =>
			{
				options.AddPolicy("DevCors", policy =>
					policy.WithOrigins(allowedOrigins)
						  .AllowAnyHeader()
						  .AllowAnyMethod()
						  .AllowCredentials()); // required for SignalR WebSocket handshake
			});

			// ── Database ──────────────────────────────────────────────────────────────────
			// UseCompatibilityLevel(120): the hosted DB is pinned to SQL Server 2014
			// compat mode, which doesn't support OPENJSON — EF Core 8 otherwise uses
			// OPENJSON(@p) WITH ([value] ... '$') to translate list.Contains(x) queries,
			// causing "Incorrect syntax near '$'." Forcing 120 makes EF fall back to a
			// plain parameterized IN (...) clause instead.
			builder.Services.AddDbContext<ApplicationDbContext>(options =>
				options.UseSqlServer(builder.Configuration.GetConnectionString("Default")!,
					sql => sql.UseCompatibilityLevel(120)));

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
					// SignalR WebSocket negotiation passes the token via query string
					options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
					{
						OnMessageReceived = ctx =>
						{
							var token = ctx.Request.Query["access_token"];
							if (!string.IsNullOrEmpty(token) &&
							    ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
								ctx.Token = token;
							return Task.CompletedTask;
						}
					};
				});

			builder.Services.AddAuthorization();

			// ── In-memory cache (used by GoogleReviewsService) ───────────────────────────
			builder.Services.AddMemoryCache();

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
			builder.Services.AddScoped<HindIndisk.Api.Application.Services.ICustomerService,
									HindIndisk.Api.Application.Services.CustomerService>();
			builder.Services.AddScoped<HindIndisk.Api.Application.Services.SlotService>();
			builder.Services.AddScoped<HindIndisk.Api.Application.Services.ScheduleService>();
			builder.Services.AddScoped<HindIndisk.Api.Application.Services.BranchServiceStatusService>();
			builder.Services.AddScoped<HindIndisk.Api.Application.Services.BranchClosureService>();
			builder.Services.AddScoped<IEmailSettingsService, EmailSettingsService>();
			builder.Services.AddScoped<IHeroSlideService, HeroSlideService>();
			builder.Services.AddScoped<IGalleryImageService, GalleryImageService>();
			builder.Services.AddScoped<IAboutService, AboutService>();
			builder.Services.AddScoped<IWhyChooseUsService, WhyChooseUsService>();
			builder.Services.AddScoped<IHomeStorySectionService, HomeStorySectionService>();
			builder.Services.AddTransient<IExceptionLogService, ExceptionLogService>();

			// ── Email service ─────────────────────────────────────────────────────────────
			builder.Services.AddScoped<IEmailService, EmailService>();

			// ── Google Reviews ────────────────────────────────────────────────────────────
			builder.Services.AddHttpClient("GooglePlaces");
			builder.Services.AddSingleton<HindIndisk.Api.Application.Services.IGoogleReviewsService,
										  HindIndisk.Api.Application.Services.GoogleReviewsService>();

			// ── Health checks ─────────────────────────────────────────────────────────────
			builder.Services.AddHealthChecks()
				.AddSqlServer(builder.Configuration.GetConnectionString("Default")!);

			// ── SignalR ───────────────────────────────────────────────────────────────────
			builder.Services.AddSignalR();

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

			var app = builder.Build();
			
			using (var scope = app.Services.CreateScope())
			{
				var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

				await db.Database.MigrateAsync();

				await DataSeeder.SeedAsync(db, builder.Configuration);
			}

			app.UseMiddleware<ExceptionLoggingMiddleware>();
			app.UseMiddleware<RequestLoggingMiddleware>();

			app.UseDefaultFiles();
			app.UseStaticFiles();
			app.UseCors("DevCors");

			// Configure the HTTP request pipeline.
			//if (app.Environment.IsDevelopment())
			//{
			app.UseSwagger();
			app.UseSwaggerUI();
			//}

			app.UseHttpsRedirection();
			app.UseAuthentication();
			app.UseAuthorization();


			app.MapControllers();
			app.MapHub<ClosureHub>("/hubs/closures");
			app.MapHub<CustomerHub>("/hubs/customer");
			app.MapHub<AdminHub>("/hubs/admin");
			app.MapHealthChecks("/health");

			app.MapFallbackToFile("/index.html");

			app.Run();
		}
	}
}
