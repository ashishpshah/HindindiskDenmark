namespace HindIndisk.Api.Application.DTOs.Admin;

public class UpdateMenuItemPricesRequest
{
    public IReadOnlyList<BranchPriceInput> Prices { get; set; } = [];
}

public class BranchPriceInput
{
    public long    BranchId { get; set; }
    public decimal Price    { get; set; }
}
