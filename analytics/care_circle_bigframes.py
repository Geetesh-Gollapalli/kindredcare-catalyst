"""
KindredCare AI — Population Adherence & Missed-Dose Forecasting with BigQuery DataFrames (BigFrames)
Built with @[plugin:data-agent-kit-plugin] (bigquery-bigframes skill guidelines):
- Stays in Google Cloud BigQuery (no .to_pandas() full-table downloads, no raw SQL in read_gbq)
- Uses built-in Series/DataFrame accessors (.dt, .str) instead of lambdas
- Uses bigframes.ml.forecasting.ARIMAPlus for 7-day adherence forecasting and persists via model.to_gbq()
"""

import bigframes.pandas as bpd
from bigframes.ml.forecasting import ARIMAPlus


def run_care_circle_adherence_pipeline(
    project_id: str = "kindredcare-catalyst-2026",
    dataset_id: str = "kindredcare_analytics",
) -> None:
    bpd.options.bigquery.project = project_id

    # 1. Load Cloud Firestore -> BigQuery federated dose logs table
    dose_logs = bpd.read_gbq(f"{project_id}.{dataset_id}.dose_logs")
    print("Schema dtypes:", dose_logs.dtypes)
    print(dose_logs.peek(5))

    # 2. Compute daily adherence rate in-cloud using built-in accessors (no UDFs/lambdas)
    dose_logs["taken_flag"] = (dose_logs["status"] == "taken").astype("Int64")
    daily_adherence = (
        dose_logs.groupby("scheduled_date", as_index=False)
        .agg({"taken_flag": "mean"})
        .rename(columns={"taken_flag": "adherence_ratio"})
        .sort_values("scheduled_date")
    )

    # 3. Train BigQuery ML ARIMAPlus time-series model for 7-day adherence forecasting
    forecaster = ARIMAPlus(
        horizon=7,
        auto_arima=True,
        data_frequency="DAILY",
    )
    X_train = daily_adherence[["scheduled_date"]]
    y_train = daily_adherence[["adherence_ratio"]]
    forecaster.fit(X_train, y_train)

    # 4. Predict next 7 days of Care Circle adherence in-cloud
    forecast_df = forecaster.predict()
    print(forecast_df.head(7))

    # 5. Persist trained adherence model back to BigQuery
    forecaster.to_gbq(
        f"{project_id}.{dataset_id}.elder_adherence_arima_model",
        replace=True,
    )


if __name__ == "__main__":
    run_care_circle_adherence_pipeline()
