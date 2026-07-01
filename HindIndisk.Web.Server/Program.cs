using System.Text;
using HindIndisk.Api.Application.Services;
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
						  .AllowAnyMethod());
			});

			// ── Database ──────────────────────────────────────────────────────────────────
			builder.Services.AddDbContext<ApplicationDbContext>(options =>
				options.UseSqlServer(builder.Configuration.GetConnectionString("Default")!));

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

			// ── In-memory cache (OTP storage for password reset) ─────────────────────────
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
			builder.Services.AddTransient<IExceptionLogService, ExceptionLogService>();

			// ── Email service ─────────────────────────────────────────────────────────────
			builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
			builder.Services.AddScoped<IEmailService, EmailService>();

			// ── Google Reviews ────────────────────────────────────────────────────────────
			builder.Services.AddHttpClient("GooglePlaces");
			builder.Services.AddSingleton<HindIndisk.Api.Application.Services.IGoogleReviewsService,
										  HindIndisk.Api.Application.Services.GoogleReviewsService>();

			// ── Health checks ─────────────────────────────────────────────────────────────
			builder.Services.AddHealthChecks()
				.AddSqlServer(builder.Configuration.GetConnectionString("Default")!);

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

				await DataSeeder.SeedAsync(db);
			}

			app.UseMiddleware<ExceptionLoggingMiddleware>();

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
			app.MapHealthChecks("/health");

			app.MapFallbackToFile("/index.html");

			app.Run();
		}
	}
}
