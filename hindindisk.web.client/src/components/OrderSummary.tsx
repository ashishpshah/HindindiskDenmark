import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
  orderType: "pickup" | "delivery";
  showFee?: boolean;
};

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${highlight ? "text-primary font-semibold" : "text-muted-foreground"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

export function OrderSummary({ subtotal, discount, delivery, total, orderType, showFee = true }: Props) {
  const { t } = useI18n();
  const feeLabel = orderType === "delivery" ? t("cart.delivery") : t("cart.poseCharges");
  return (
    <>
      <div className="space-y-1">
        <Row label={t("cart.subtotal")} value={`${subtotal} DKK`} />
        {discount > 0 && <Row label={t("cart.discount")} value={`-${discount} DKK`} highlight />}
        {showFee && delivery > 0 && <Row label={feeLabel} value={`${delivery} DKK`} />}
      </div>
      <div className="mt-3 flex justify-between border-t pt-3 font-display text-xl">
        <span>{t("cart.total")}</span>
        <span>{total} DKK</span>
      </div>
    </>
  );
}
