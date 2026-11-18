import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleHelp,
  CreditCard,
  FlaskConical,
  History,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet
} from "lucide-react";
import { useAuth } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createApiClient } from "@/lib/api-client";
import { toast } from "sonner";

const formatDate = value => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
  : "Not available";

const formatPrice = amountPaise => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(amountPaise / 100);

export default function BillingPage() {
  const { getToken, isLoaded, isSignedIn, user } = useAuth();
  const [credits, setCredits] = useState(null);
  const [demoConfig, setDemoConfig] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [demoConfigError, setDemoConfigError] = useState("");
  const [purchasingPack, setPurchasingPack] = useState("");
  const [purchasingPlan, setPurchasingPlan] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const loadBillingData = useCallback(async () => {
    const client = createApiClient(getToken);
    const [creditResult, configResult, transactionResult] = await Promise.allSettled([
      client.credits.get(),
      client.credits.getDemoConfig(),
      client.credits.getTransactions()
    ]);
    if (creditResult.status === "rejected") throw creditResult.reason;
    setCredits(creditResult.value);

    if (configResult.status === "fulfilled") {
      setDemoConfig(configResult.value);
      setDemoConfigError("");
    } else {
      console.error("Failed to load demo billing configuration:", configResult.reason);
      setDemoConfig(null);
      setDemoConfigError(configResult.reason?.message || "Demo checkout configuration could not be loaded.");
    }

    if (transactionResult.status === "fulfilled") {
      setTransactions(transactionResult.value);
      setHistoryError("");
    } else {
      console.error("Failed to load credit transaction history:", transactionResult.reason);
      setTransactions([]);
      setHistoryError(transactionResult.reason?.message || "Credit history could not be loaded.");
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let active = true;
    setLoading(true);
    loadBillingData()
      .then(() => {
        if (active) setLoadError("");
      })
      .catch(error => {
        console.error("Failed to load billing data:", error);
        if (active) setLoadError(error.message || "Billing information could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, loadBillingData]);

  const usedCredits = useMemo(() => {
    if (!credits || credits.remaining < 0 || credits.total < 0) return 0;
    return Math.max(0, credits.total - credits.remaining);
  }, [credits]);
  const usagePercent = credits?.total > 0 && credits.remaining >= 0
    ? Math.min(100, Math.round((credits.remaining / credits.total) * 100))
    : 0;

  const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not be loaded. Check your internet connection."));
    document.body.appendChild(script);
  });

  const verifyRazorpayPayment = async response => {
    const client = createApiClient(getToken);
    await client.credits.verifyCheckout({
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature
    });
    await loadBillingData();
    window.dispatchEvent(new CustomEvent("refresh-credits"));
    setPendingPayment(null);
    toast.success("Payment confirmed. Your purchase is active.");
  };

  const reconcilePendingPayments = async () => {
    try {
      setVerifyingPayment(true);
      const client = createApiClient(getToken);
      const result = await client.credits.reconcileCheckout();
      await loadBillingData();
      window.dispatchEvent(new CustomEvent("refresh-credits"));
      if (result.recovered) {
        setPendingPayment(null);
        toast.success("Your captured Razorpay payment was found and applied.");
      } else {
        toast.info("No captured payment was found. If money was deducted, wait a moment and retry.");
      }
    } catch (error) {
      console.error("Could not reconcile pending Razorpay payment:", error);
      toast.error(error.message || "Could not check the payment status.");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const startRazorpayCheckout = async ({ productType, packId, description, busyKey }) => {
    let checkoutOpened = false;
    try {
      if (busyKey === "pro") setPurchasingPlan(true);
      else setPurchasingPack(busyKey);
      const client = createApiClient(getToken);
      const order = await client.credits.createCheckout({ productType, packId });
      await loadRazorpayCheckout();
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "WebCraft",
        description,
        order_id: order.orderId,
        prefill: {
          name: user?.displayName || user?.username || "",
          email: user?.email || ""
        },
        theme: { color: "#7c3aed"         },
        handler: async response => {
          setPendingPayment(response);
          try {
            await verifyRazorpayPayment(response);
            toast.success(productType === "PRO_MONTHLY"
              ? "Pro activated for 30 days."
              : "Payment confirmed. Credits added to your balance.");
          } catch (error) {
            console.error("Razorpay payment verification failed:", error);
            toast.error(error.message || "Payment was received, but verification is still pending. Please contact support with your payment ID.");
          } finally {
            if (busyKey === "pro") setPurchasingPlan(false);
            else setPurchasingPack("");
          }
        },
        modal: {
          ondismiss: () => {
            if (busyKey === "pro") setPurchasingPlan(false);
            else setPurchasingPack("");
          }
        }
      });
      checkout.on("payment.failed", response => {
        console.error("Razorpay payment failed:", response.error?.code, response.error?.description);
        toast.error(response.error?.description || "Payment failed. You have not been charged successfully.");
        if (busyKey === "pro") setPurchasingPlan(false);
        else setPurchasingPack("");
      });
      checkout.open();
      checkoutOpened = true;
    } catch (error) {
      console.error("Razorpay checkout could not be started:", error);
      toast.error(error.message || "Checkout could not be started.");
    } finally {
      if (!checkoutOpened) {
        if (busyKey === "pro") setPurchasingPlan(false);
        else setPurchasingPack("");
      }
    }
  };

  const handlePurchase = async pack => {
    if (purchasingPack || purchasingPlan) return;
    if (demoConfig?.razorpayEnabled) {
      await startRazorpayCheckout({
        productType: "CREDIT_PACK",
        packId: pack.id,
        description: `${pack.credits} WebCraft credits`,
        busyKey: pack.id
      });
      return;
    }
    if (!demoConfig?.enabled) return;
    try {
      setPurchasingPack(pack.id);
      const client = createApiClient(getToken);
      await client.credits.purchaseDemoPack(pack.id);
      await loadBillingData();
      window.dispatchEvent(new CustomEvent("refresh-credits"));
      toast.success(`${pack.credits} demo credits added to your balance.`);
    } catch (error) {
      console.error("Demo credit purchase failed:", error);
      toast.error(error.message || "Demo purchase could not be completed.");
    } finally {
      setPurchasingPack("");
    }
  };

  const handleProPurchase = async () => {
    if (!demoConfig?.razorpayEnabled || purchasingPack || purchasingPlan) return;
    await startRazorpayCheckout({
      productType: "PRO_MONTHLY",
      description: "WebCraft Pro access · 30 days",
      busyKey: "pro"
    });
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-full max-w-6xl items-center justify-center p-8">
        <Loader2 className="size-6 animate-spin text-primary" aria-label="Loading billing" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-5 sm:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <CreditCard className="size-4" />
            Account
            <span className="text-muted-foreground">/</span>
            Billing
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Billing & credits</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Check your plan, understand your balance, and review credit activity in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:self-auto">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          Secure account billing
        </div>
      </header>

      {loadError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" size="sm" onClick={() => {
              setLoading(true);
              loadBillingData()
                .then(() => setLoadError(""))
                .catch(error => setLoadError(error.message || "Billing information could not be loaded."))
                .finally(() => setLoading(false));
            }}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {demoConfig?.razorpayEnabled && (
        <Card className="border-amber-500/25 bg-amber-500/[0.04]">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div className="text-sm">
              <p className="font-medium">Already paid, but the purchase is not showing?</p>
              <p className="mt-1 text-muted-foreground">
                Check Razorpay for a captured payment before starting another checkout.
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={verifyingPayment} onClick={reconcilePendingPayments}>
              {verifyingPayment && <Loader2 className="size-3.5 animate-spin" />}
              Check payment status
            </Button>
          </CardContent>
        </Card>
      )}

      {pendingPayment && (
        <Card className="border-amber-500/30 bg-amber-500/[0.05]">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div className="text-sm">
              <p className="font-medium">Payment verification needs a retry</p>
              <p className="mt-1 text-muted-foreground">
                Don’t pay again yet. Retry verification for the payment that just completed.
              </p>
            </div>
            <Button disabled={verifyingPayment} onClick={async () => {
              try {
                setVerifyingPayment(true);
                await verifyRazorpayPayment(pendingPayment);
              } catch (error) {
                console.error("Razorpay verification retry failed:", error);
                toast.error(error.message || "Payment verification is still pending.");
              } finally {
                setVerifyingPayment(false);
              }
            }}>
              {verifyingPayment ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
              Retry verification
            </Button>
          </CardContent>
        </Card>
      )}

      {credits && (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card">
              <div className="pointer-events-none absolute -right-12 -top-14 size-48 rounded-full bg-primary/10 blur-3xl" />
              <CardHeader className="relative flex-row items-start justify-between">
                <div>
                  <CardDescription>Current plan</CardDescription>
                  <CardTitle className="mt-2 flex items-center gap-2 text-2xl">
                    {credits.plan?.toLowerCase() === "pro" ? "Pro" : "Free"}
                    {credits.plan?.toLowerCase() === "pro" && <Sparkles className="size-5 text-primary" />}
                  </CardTitle>
                </div>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {credits.plan || "FREE"}
                </span>
              </CardHeader>
              <CardContent className="relative space-y-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-4xl font-semibold tracking-tight">
                      {credits.remaining < 0 ? "∞" : credits.remaining}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {credits.remaining < 0 ? "Unlimited credits" : `available of ${credits.total}`}
                    </p>
                  </div>
                  {credits.remaining >= 0 && (
                    <p className="pb-1 text-right text-xs text-muted-foreground">
                      {usedCredits} used
                    </p>
                  )}
                </div>
                {credits.remaining >= 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Credit balance</span>
                      <span>{usagePercent}% remaining</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label="Credit balance remaining"
                      aria-valuenow={usagePercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${usagePercent <= 15 ? "bg-amber-500" : "bg-gradient-to-r from-primary to-sky-400"}`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {credits.periodEnd ? `${credits.plan?.toLowerCase() === "pro" ? "Expires" : "Next allowance"} ${formatDate(credits.periodEnd)}` : "No renewal date"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="size-3.5" />
                    {credits.plan?.toLowerCase() === "pro" ? "Pro plan" : "Monthly free allowance"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                  <CircleHelp className="size-4" />
                </div>
                <CardTitle className="pt-1">How credits work</CardTitle>
                <CardDescription>Simple, predictable usage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">New project generation uses 10 credits.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">An AI edit uses 3 credits when the balance allows.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">Purchased demo credits stay available across monthly renewals.</span>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Add credits</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose a pack that fits your next build.</p>
              </div>
              <p className="text-xs text-muted-foreground">One-time top-up · Credits do not expire</p>
            </div>

            {demoConfigError ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-sm">
                <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium">Billing demo endpoints are unavailable</p>
                  <p className="mt-1 text-muted-foreground">
                    Restart the backend so it loads the latest billing API. No real payment was attempted.
                  </p>
                </div>
              </div>
            ) : !demoConfig?.enabled && !demoConfig?.razorpayEnabled && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-sm">
                <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium">Checkout is not configured</p>
                  <p className="mt-1 text-muted-foreground">
                    Add Razorpay test credentials to <code className="rounded bg-muted px-1.5 py-0.5">backend/.env</code>,
                    or enable the local demo with <code className="rounded bg-muted px-1.5 py-0.5">BILLING_DEMO_ENABLED=true</code>.
                  </p>
                </div>
              </div>
            )}

            <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.07] via-card to-card">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardDescription>Monthly plan</CardDescription>
                  <CardTitle className="mt-1 flex items-center gap-2 text-xl">
                    <Sparkles className="size-5 text-primary" />
                    WebCraft Pro
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Unlimited generations and premium models for 30 days.
                  </CardDescription>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-semibold">{formatPrice(demoConfig?.proPricePaise || 49900)}</p>
                  <p className="text-xs text-muted-foreground">one-time · 30 days</p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" />Unlimited AI usage</span>
                  <span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" />Premium models</span>
                  <span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-emerald-500" />No auto-renewal</span>
                </div>
                {demoConfig?.razorpayEnabled ? (
                  <Button className="gap-2 sm:min-w-44" disabled={purchasingPlan || Boolean(purchasingPack)} onClick={handleProPurchase}>
                    {purchasingPlan ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                    {purchasingPlan ? "Opening checkout..." : credits?.plan?.toLowerCase() === "pro" ? "Extend Pro access" : "Get Pro"}
                  </Button>
                ) : demoConfig?.enabled ? (
                  <Button className="gap-2 sm:min-w-44" disabled={purchasingPlan || Boolean(purchasingPack)} onClick={() => toast.info("Pro demo checkout is not enabled. Use Razorpay test keys to try a Pro purchase.")}>
                    <CreditCard className="size-4" />
                    Razorpay setup required
                  </Button>
                ) : (
                  <Button className="gap-2 sm:min-w-44" disabled>
                    <CreditCard className="size-4" />
                    Checkout unavailable
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              {(demoConfig?.packs || []).map(pack => (
                <Card
                  key={pack.id}
                  className={`relative ${pack.featured ? "border-primary/50 shadow-[0_0_24px_rgba(99,102,241,0.10)]" : ""}`}
                >
                  {pack.featured && (
                    <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Popular
                    </span>
                  )}
                  <CardHeader>
                    <CardDescription>{pack.name} pack</CardDescription>
                    <CardTitle className="text-3xl">{pack.credits.toLocaleString()} <span className="text-base font-normal text-muted-foreground">credits</span></CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-2xl font-semibold">{formatPrice(pack.amountPaise)} <span className="text-xs font-normal text-muted-foreground">{demoConfig?.razorpayEnabled ? "one-time" : "demo price"}</span></p>
                    <Button
                      className="w-full gap-2"
                      variant={pack.featured ? "default" : "outline"}
                      disabled={(!demoConfig?.enabled && !demoConfig?.razorpayEnabled) || Boolean(purchasingPack) || purchasingPlan}
                      onClick={() => handlePurchase(pack)}
                    >
                      {purchasingPack === pack.id
                        ? <Loader2 className="size-4 animate-spin" />
                        : <CreditCard className="size-4" />}
                      {purchasingPack === pack.id ? "Opening checkout..." : demoConfig?.razorpayEnabled ? "Buy securely" : "Try demo checkout"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {demoConfigError && (
              <Button variant="outline" size="sm" onClick={() => {
                loadBillingData().catch(error => {
                  console.error("Failed to refresh billing data:", error);
                  setLoadError(error.message || "Billing information could not be loaded.");
                });
              }}>
                Retry billing endpoints
              </Button>
            )}
            {demoConfig?.razorpayEnabled ? (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3 text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                <p><strong className="text-foreground">Razorpay {demoConfig.razorpayKeyId?.startsWith("rzp_test_") ? "test mode" : "checkout"}:</strong> payments are verified by the backend before credits or Pro access are granted. Pro is a one-time 30-day purchase and does not auto-renew.</p>
              </div>
            ) : demoConfig?.enabled && (
              <div className="flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/[0.04] px-4 py-3 text-xs leading-5 text-muted-foreground">
                <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
                <p><strong className="text-foreground">Test mode:</strong> no money is collected. The demo action adds test credits to your account and records a clearly marked demo transaction. These sample prices are not live offers. Configure Razorpay test keys to test gateway checkout without real charges.</p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Recent activity</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your latest credit usage and demo top-ups.</p>
              </div>
              <History className="mb-1 size-4 text-muted-foreground" />
            </div>
            {historyError && (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-sm">
                <p className="text-muted-foreground">
                  Credit history is unavailable until the backend is restarted with the latest billing changes.
                </p>
                <Button variant="outline" size="sm" onClick={() => {
                  loadBillingData().catch(error => {
                    console.error("Failed to refresh billing data:", error);
                    setLoadError(error.message || "Billing information could not be loaded.");
                  });
                }}>
                  Retry
                </Button>
              </div>
            )}
            <Card>
              {transactions.length === 0 ? (
                <CardContent className="flex flex-col items-center py-10 text-center">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <History className="size-4" />
                  </div>
                  <p className="text-sm font-medium">No credit activity yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">New generation usage and demo top-ups will be recorded here.</p>
                </CardContent>
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map(transaction => {
                    const isCredit = transaction.creditChange > 0;
                    const isDemo = transaction.type === "DEMO_PURCHASE";
                    const isPlanPurchase = transaction.description?.toLowerCase().includes("pro plan");
                    return (
                      <div key={transaction.id} className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6 sm:px-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${isCredit ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                            {isCredit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{transaction.description}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(transaction.createdAt)}
                              {isDemo && <span className="ml-2 rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-500">DEMO</span>}
                            </p>
                          </div>
                        </div>
                        <div className={`pl-12 text-sm font-semibold sm:pl-0 ${isCredit ? "text-emerald-500" : "text-foreground"}`}>
                          {isPlanPurchase ? "Pro plan" : `${isCredit ? "+" : ""}${transaction.creditChange} credits`}
                          {transaction.amountPaidPaise > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">{formatPrice(transaction.amountPaidPaise)}</span>}
                        </div>
                        <div className="pl-12 text-xs text-muted-foreground sm:pl-0 sm:text-right">
                          Balance after: {transaction.balanceAfter}
                          <p className="mt-1 max-w-44 truncate font-mono text-[10px]">{transaction.reference}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            <p className="text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mr-1 inline size-3.5 align-[-2px]" />
              This billing page currently supports local demo transactions only. Live payment processing is not enabled.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
