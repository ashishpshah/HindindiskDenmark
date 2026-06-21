using HindIndisk.Api.Application.DTOs.Offers;
using HindIndisk.Api.Application.DTOs.Order;

namespace HindIndisk.Api.Application.Services;

public interface IOfferService
{
    Task<IReadOnlyList<PublicOfferDto>> GetActiveOffersAsync();
    Task<CouponValidationDto>          ValidateCouponAsync(string code, decimal subtotal);
}
