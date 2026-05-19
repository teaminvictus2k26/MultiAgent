import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Send, Plane, Hotel, Map, DollarSign, BellRing, PlaneTakeoff, Loader2, Car, MapPin, ExternalLink } from "lucide-react";
import { planTrip, type TravelPlanResponse } from "@/lib/api";

export const Route = createFileRoute("/travel")({
  head: () => ({
    meta: [
      { title: "Travel Planner — Nexus" },
      { name: "description", content: "Multi-Agent autonomous travel planning." },
    ],
  }),
  component: TravelPlanner,
});

function TravelPlanner() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [origin, setOrigin] = useState("");
  const [currency, setCurrency] = useState(""); // empty = auto-detect
  const [plan, setPlan] = useState<TravelPlanResponse | null>(null);
  const [error, setError] = useState("");

  const CURRENCIES = [
    { code: "", label: "Auto-detect", symbol: "" },
    { code: "INR", label: "₹ INR (Indian Rupee)", symbol: "₹" },
    { code: "USD", label: "$ USD (US Dollar)", symbol: "$" },
    { code: "EUR", label: "€ EUR (Euro)", symbol: "€" },
    { code: "GBP", label: "£ GBP (British Pound)", symbol: "£" },
    { code: "JPY", label: "¥ JPY (Japanese Yen)", symbol: "¥" },
    { code: "AED", label: "AED (UAE Dirham)", symbol: "AED " },
  ];

  const detectLocation = async () => {
    setLocating(true);
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      setOrigin(`${data.city}, ${data.region}, ${data.country_name}`);
    } catch (e) {
      setOrigin("Unknown");
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError("");
    try {
      // Append currency hint to the prompt if user selected one
      const currencyHint = currency ? ` Please show all prices in ${currency}.` : "";
      const response = await planTrip(input + currencyHint, origin);
      setPlan(response);
    } catch (err: any) {
      setError(err.message || "Failed to plan trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center border-b border-border/60 bg-background/40 px-6 backdrop-blur-xl">
          <h1 className="font-display flex items-center gap-2 text-lg font-semibold">
            <PlaneTakeoff className="h-5 w-5 text-accent" />
            Autonomous Travel Planner
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {!plan && !loading && (
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/60 shadow-inner">
                <Map className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold">Where to next?</h2>
              <p className="mt-2 text-muted-foreground">
                Tell the supervisor agent where you want to go, your budget, and when.
                It will coordinate with flight, hotel, and itinerary agents to build your perfect trip.
              </p>
              
              <div className="mt-8 grid gap-4 sm:grid-cols-2 text-left">
                <button onClick={() => setInput("Plan a 4-day trip to Tokyo next month under $3000")} className="glass-strong rounded-xl p-4 text-sm transition-colors hover:bg-secondary/60">
                  <p className="font-medium">Tokyo, Japan</p>
                  <p className="mt-1 text-muted-foreground">4 days, $3000 budget</p>
                </button>
                <button onClick={() => setInput("I need a weekend getaway to Paris for two people, max $1500")} className="glass-strong rounded-xl p-4 text-sm transition-colors hover:bg-secondary/60">
                  <p className="font-medium">Paris, France</p>
                  <p className="mt-1 text-muted-foreground">Weekend getaway, $1500 budget</p>
                </button>
                <button onClick={() => { setInput("Plan a 3-day trip to Goa under ₹25000"); setCurrency("INR"); }} className="glass-strong rounded-xl p-4 text-sm transition-colors hover:bg-secondary/60">
                  <p className="font-medium">Goa, India 🇮🇳</p>
                  <p className="mt-1 text-muted-foreground">3 days, ₹25,000 budget</p>
                </button>
                <button onClick={() => { setInput("Plan a 4-day trip to Udupi Karnataka from Mumbai"); setCurrency("INR"); }} className="glass-strong rounded-xl p-4 text-sm transition-colors hover:bg-secondary/60">
                  <p className="font-medium">Udupi, Karnataka 🇮🇳</p>
                  <p className="mt-1 text-muted-foreground">4 days, Mumbai departure, INR</p>
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex h-full flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="animate-pulse text-sm text-muted-foreground">Agents are coordinating your trip...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          {plan && !loading && (
            <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="glass-strong rounded-2xl p-0 overflow-hidden relative">
                {plan.itinerary?.destination_image_keyword && (
                  <div className="w-full h-48 sm:h-64 overflow-hidden relative">
                    <img 
                      src={`https://source.unsplash.com/1200x600/?${encodeURIComponent(plan.destination)},travel,landmark`}
                      alt={plan.destination}
                      className="w-full h-full object-cover brightness-75"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(plan.destination)}/1200/600`; }}
                    />
                    <div className="absolute bottom-6 left-6 text-white drop-shadow-md">
                      <h2 className="font-display text-4xl font-bold">{plan.destination}</h2>
                      <p className="mt-1 opacity-90">Departing from: {plan.origin}</p>
                    </div>
                  </div>
                )}
                {!plan.itinerary?.destination_image_keyword && (
                  <div className="p-6 md:p-8">
                    <h2 className="font-display text-3xl font-bold">{plan.destination}</h2>
                    <p className="mt-1 text-muted-foreground">Departing from: {plan.origin}</p>
                  </div>
                )}
                
                <div className="p-6 md:p-8 pt-6">
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-sm font-medium">
                      <DollarSign className="h-4 w-4" /> Budget: {plan.currency_symbol}{plan.budget.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-sm font-medium">
                      <Map className="h-4 w-4" /> Dates: {plan.dates}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-sm font-medium">
                      {plan.currency}
                    </span>
                  </div>
                  <p className="mt-4 text-muted-foreground">{plan.message}</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Plane className="h-5 w-5 text-blue-400" /> Flights
                  </h3>
                  <div className="space-y-3">
                    {plan.flights.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{f.airline}</p>
                            {f.booking_url && (
                              <a href={f.booking_url} target="_blank" rel="noreferrer" className="text-accent hover:underline" title="Book flight">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{f.flight_number} • {f.departure_time} - {f.arrival_time}</p>
                        </div>
                        <p className="font-bold">{plan.currency_symbol}{f.price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Hotel className="h-5 w-5 text-amber-400" /> Accommodations
                  </h3>
                  <div className="space-y-3">
                    {plan.hotels.map((h, i) => (
                      <div key={i} className="flex gap-4 rounded-xl border border-border/60 bg-background/40 p-4">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                          <img 
                            src={`https://source.unsplash.com/120x120/?${encodeURIComponent(h.name)},hotel`}
                            alt={h.name}
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(h.name)}/120/120`; }}
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium leading-none">{h.name}</p>
                                {h.booking_url && (
                                  <a href={h.booking_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline" title="View hotel">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs text-muted-foreground">In: {h.check_in} • Out: {h.check_out}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold leading-none">{plan.currency_symbol}{h.total_price.toLocaleString()}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground">{plan.currency_symbol}{h.price_per_night.toLocaleString()}/night</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold">
                    <Car className="h-5 w-5 text-emerald-400" /> Taxis & Transfers
                  </h3>
                  <div className="space-y-3">
                    {plan.taxis?.map((t, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{t.company}</p>
                            {t.booking_url && (
                              <a href={t.booking_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline" title="Book transfer">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{t.pickup} to {t.dropoff}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{plan.currency_symbol}{t.estimated_cost.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{t.vehicle_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {plan.itinerary?.activities && plan.itinerary.activities.length > 0 && (
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-display mb-4 text-lg font-semibold">Itinerary Planner</h3>
                  <div className="space-y-4">
                    {plan.itinerary.activities.map((act, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                            {act.day}
                          </div>
                          {i !== plan.itinerary!.activities.length - 1 && <div className="mt-2 w-px flex-1 bg-border/60" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex gap-4 rounded-xl border border-border/60 bg-background/40 p-4">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                              <img 
                                src={`https://source.unsplash.com/160x160/?${encodeURIComponent(act.location_name)}`}
                                alt={act.location_name}
                                className="h-full w-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${encodeURIComponent(act.location_name)}/160/160`; }}
                              />
                            </div>
                            <div className="flex flex-1 justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-primary leading-none">{act.location_name}</p>
                                  {act.booking_url && (
                                    <a href={act.booking_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                                <p className="font-medium mt-2 text-sm">{act.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">{act.time}</p>
                              </div>
                              <p className="font-semibold text-accent">{plan.currency_symbol}{act.cost.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.budget_report && (
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold">
                    <DollarSign className="h-5 w-5 text-emerald-400" /> Budget Optimization
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-5">
                    <div className="rounded-xl bg-background/40 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Flights</p>
                      <p className="mt-1 text-xl font-bold">{plan.currency_symbol}{plan.budget_report.total_flights.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-background/40 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Hotels</p>
                      <p className="mt-1 text-xl font-bold">{plan.currency_symbol}{plan.budget_report.total_hotels.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-background/40 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Taxis</p>
                      <p className="mt-1 text-xl font-bold">{plan.currency_symbol}{plan.budget_report.total_taxis.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-background/40 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Activities</p>
                      <p className="mt-1 text-xl font-bold">{plan.currency_symbol}{plan.budget_report.total_activities.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-background/40 p-4 text-center border border-accent/20">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className={plan.budget_report.is_within_budget ? "mt-1 text-xl font-bold text-emerald-400" : "mt-1 text-xl font-bold text-destructive"}>
                        {plan.currency_symbol}{plan.budget_report.grand_total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {plan.budget_report.optimization_suggestions && plan.budget_report.optimization_suggestions.length > 0 && (
                    <div className="mt-4 rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm">
                      <p className="font-medium">Agent Suggestion:</p>
                      <ul className="mt-1 list-inside list-disc text-muted-foreground">
                        {plan.budget_report.optimization_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {plan.booking_confirmation && (
                <div className="glass-strong rounded-2xl border-emerald-500/20 bg-emerald-500/5 p-6">
                  <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-400">
                    <BellRing className="h-5 w-5" /> Booking Execution
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 rounded-xl bg-background/60 p-4">
                      <p className="text-sm text-muted-foreground">Flight Reference</p>
                      <p className="mt-1 font-mono font-bold tracking-widest">{plan.booking_confirmation.flight_booking_ref}</p>
                    </div>
                    <div className="flex-1 rounded-xl bg-background/60 p-4">
                      <p className="text-sm text-muted-foreground">Hotel Reference</p>
                      <p className="mt-1 font-mono font-bold tracking-widest">{plan.booking_confirmation.hotel_booking_ref}</p>
                    </div>
                    <div className="flex-1 rounded-xl bg-background/60 p-4">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="mt-1 font-bold text-emerald-400">{plan.booking_confirmation.status}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 bg-background/40 p-4 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={detectLocation}
                disabled={locating}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                {origin || "Detect Origin"}
              </button>
              {/* Currency selector */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none focus:border-accent hover:text-foreground cursor-pointer"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              {currency && (
                <span className="text-xs text-accent font-mono font-medium">
                  Prices in {currency}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Where do you want to go? e.g. 'Plan a 4-day trip to Rome under $2500'"
                className="h-14 w-full rounded-2xl border border-border bg-secondary/40 px-6 pr-16 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-accent focus:bg-secondary/60"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:opacity-50"
                style={{ background: "var(--gradient-hero)" }}
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
