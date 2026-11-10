
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchPlans,
  fetchIngestionStatus,
  ingestPlan,
  searchPlanRecords,
  type Plan,
  type IngestionStatus,
  type RateRecord,
} from "./api/transparencyApi";

export default function TransparencyExplorer() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("");

  const [ingestion, setIngestion] =
    useState<IngestionStatus | null>(null);

  const [billingCode, setBillingCode] = useState("");
  const [description, setDescription] = useState("");

  const [results, setResults] = useState<RateRecord[]>([]);
  const [totalBillingResults, setTotalBillingResults] = useState(0);
  const [totalNegotiatedResults, setTotalNegotiatedResults] = useState(0);

  const [hasSearched, setHasSearched] = useState(false);

  const [loadingPlans, setLoadingPlans] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  // Load available plans
  useEffect(() => {
    async function loadPlans() {
      try {
        const data = await fetchPlans();
        setPlans(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load plans"
        );
      } finally {
        setLoadingPlans(false);
      }
    }

    loadPlans();
  }, []);

  // Check ingestion status
  async function checkStatus(planKey: string) {
    const data = await fetchIngestionStatus(planKey);
    setIngestion(data);
    return data;
  }

  // Check status when selected plan changes
  useEffect(() => {
    if (!selectedPlan) {
      setIngestion(null);
      setResults([]);
      setTotalBillingResults(0);
      setTotalNegotiatedResults(0);
      setHasSearched(false);
      setError("");
      return;
    }

    setIngestion(null);
    setResults([]);
    setTotalBillingResults(0);
    setTotalNegotiatedResults(0);
    setHasSearched(false);
    setError("");

    checkStatus(selectedPlan).catch((err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to check ingestion status"
      );
    });
  }, [selectedPlan]);

  // Trigger ingestion
  async function ingestSelectedPlan() {
    if (!selectedPlan) return;

    setIngesting(true);
    setError("");

    try {
      await ingestPlan(selectedPlan);
      await checkStatus(selectedPlan);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ingestion failed"
      );
    } finally {
      setIngesting(false);
    }
  }

  // Poll while ingestion is running
  useEffect(() => {
    if (
      !selectedPlan ||
      !ingestion ||
      !["pending", "processing"].includes(ingestion.status)
    ) {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        await checkStatus(selectedPlan);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Status check failed"
        );
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [selectedPlan, ingestion?.status]);

  // Search records
  async function searchRates(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedPlan) return;

    setSearching(true);
    setError("");
    setResults([]);
    setTotalBillingResults(0);
    setTotalNegotiatedResults(0);
    setHasSearched(true);

    try {
      const data = await searchPlanRecords(selectedPlan, {
        billingCode,
        description,
      });

      setResults(data.results || []);
      setTotalBillingResults(data.unique_billing_codes ?? 0);
      setTotalNegotiatedResults(data.total_negotiated_rates ?? 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Search failed"
      );
    } finally {
      setSearching(false);
    }
  }

  const selectedPlanData = plans?.find(
    (plan) => plan.plan_key === selectedPlan
  );

  const ready = ingestion?.status === "completed";

  function formatCurrency(value?: number) {
    if (value == null) return "—";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Transparency in Coverage
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Rate Explorer
          </h1>

          <p className="mt-2 text-slate-500">
            Explore negotiated healthcare rates across insurance plans.
          </p>
        </div>

        {/* Plan selection */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Select an insurance plan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose a plan to access its in-network pricing data.
            </p>
          </div>

          <label className="mb-2 block text-sm font-medium">
            Insurance plan
          </label>

          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            disabled={loadingPlans}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              {loadingPlans ? "Loading plans..." : "Choose a plan"}
            </option>

            {plans.map((plan) => (
              <option key={plan.plan_key} value={plan.plan_key}>
                {plan.plan_name || plan.name || plan.plan_key}
                {plan.state ? ` — ${plan.state}` : ""}
              </option>
            ))}
          </select>

          {selectedPlanData && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
              <p>
                <span className="text-slate-500">Plan ID:</span>{" "}
                {selectedPlanData.plan_id || "—"}
              </p>

              <p className="mt-1 break-all">
                <span className="text-slate-500">Plan key:</span>{" "}
                {selectedPlan}
              </p>
            </div>
          )}
        </section>

        {/* Ingestion */}
        {selectedPlan && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Data ingestion
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Prepare the selected plan's in-network pricing data.
                </p>
              </div>

              <StatusBadge
                status={ingestion?.status || "not_started"}
              />
            </div>

            <div className="mt-6">
              {ingestion ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Records processed
                    </span>

                    <strong>
                      {ingestion.records_processed?.toLocaleString()}
                    </strong>
                  </div>

                  {["pending", "processing"].includes(
                    ingestion.status
                  ) && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
                    </div>
                  )}

                  {ready && (
                    <p className="mt-3 text-sm text-green-700">
                      Your plan data is ready.
                    </p>
                  )}

                  {ingestion.status === "failed" && (
                    <p className="mt-3 text-sm text-red-600">
                      {ingestion.error_message || "Ingestion failed."}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  This plan has not been ingested yet.
                </p>
              )}

              {/* Show View Data when ingestion is completed */}
              {ready ? (
                <button
                  onClick={() =>
                    navigate(`/plans/${selectedPlan}/data`)
                  }
                  className="mt-5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  View Data →
                </button>
              ) : (
                <button
                  onClick={ingestSelectedPlan}
                  disabled={
                    ingesting ||
                    ["pending", "processing"].includes(
                      ingestion?.status || ""
                    )
                  }
                  className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ingesting
                    ? "Starting ingestion..."
                    : ["pending", "processing"].includes(
                        ingestion?.status || ""
                      )
                    ? "Ingesting..."
                    : ingestion?.status === "failed"
                    ? "Retry ingestion"
                    : "Ingest plan data"}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Search */}
        {ready && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Search negotiated rates
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search by billing code and optionally narrow results by description.
              </p>
            </div>

            <form onSubmit={searchRates}>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Billing code
                  </label>

                  <input
                    value={billingCode}
                    onChange={(e) => setBillingCode(e.target.value)}
                    placeholder="e.g. 99213"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Description (optional)
                  </label>

                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. office visit"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="mt-5 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {searching ? "Searching..." : "Search rates"}
              </button>
            </form>
          </section>
        )}

        {/* Search results */}
        {ready && hasSearched && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Search results
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {totalBillingResults?.toLocaleString()} matching unique billing codes
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {totalNegotiatedResults?.toLocaleString()} matching negotiated price records
              </p>
            </div>

            {results?.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
                No matching records found. Try another billing code or description.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-4 py-3">Billing code</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Billing class</th>
                      <th className="px-4 py-3">Negotiated rate</th>
                      <th className="px-4 py-3">Rate type</th>
                    </tr>
                  </thead>

                  <tbody>
                    {results?.flatMap((record, recordIndex) =>
                      record.negotiated_rates?.flatMap(
                        (group, groupIndex) =>
                          group.negotiated_prices?.map(
                            (price, priceIndex) => (
                              <tr
                                key={`${recordIndex}-${groupIndex}-${priceIndex}`}
                                className="border-b border-slate-100 hover:bg-slate-50"
                              >
                                <td className="px-4 py-4 font-medium">
                                  {record.billing_code}
                                  <span className="block text-xs text-slate-400">
                                    {record.billing_code_type}
                                  </span>
                                </td>

                                <td className="px-4 py-4">
                                  {record.description || "—"}
                                </td>

                                <td className="px-4 py-4">
                                  {price.billing_class || "—"}
                                </td>

                                <td className="px-4 py-4 font-semibold">
                                  {formatCurrency(price.negotiated_rate)}
                                </td>

                                <td className="px-4 py-4">
                                  {price.negotiated_type || "—"}
                                </td>
                              </tr>
                            )
                          )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    processing: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
    not_started: "bg-slate-100 text-slate-600",
  };

  const labels: Record<string, string> = {
    completed: "Completed",
    processing: "Processing",
    pending: "Pending",
    failed: "Failed",
    not_started: "Not started",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.not_started
      }`}
    >
      {labels[status] || "Not started"}
    </span>
  );
}
