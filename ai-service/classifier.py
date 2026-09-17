from pathlib import Path
import json
import sys

import joblib


BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR
    / "model"
    / "message_classifier.joblib"
)

CONFIDENCE_THRESHOLD = 0.45


def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "AI model not found. Run train_model.py first."
        )

    return joblib.load(MODEL_PATH)


def classify_message(model, message):
    message = message.strip()

    if not message:
        return {
            "category": "General Inquiry",
            "confidence": 0.0,
            "lowConfidence": True,
        }

    probabilities = model.predict_proba(
        [message]
    )[0]

    best_index = probabilities.argmax()

    predicted_category = (
        model.classes_[best_index]
    )

    confidence = float(
        probabilities[best_index]
    )

    low_confidence = (
        confidence < CONFIDENCE_THRESHOLD
    )

    # Low-confidence messages safely fall back
    # to a general category while retaining
    # the confidence value.
    category = (
        "General Inquiry"
        if low_confidence
        else predicted_category
    )

    return {
        "category": category,
        "confidence": round(confidence, 4),
        "lowConfidence": low_confidence,
    }


def main():
    try:
        model = load_model()

        if len(sys.argv) > 1:
            message = " ".join(sys.argv[1:])
        else:
            message = ""

        result = classify_message(
            model,
            message,
        )

        # JSON output allows the Node.js backend
        # to consume the prediction reliably.
        print(json.dumps(result))

    except Exception as error:
        print(
            json.dumps(
                {
                    "error": str(error),
                }
            )
        )

        sys.exit(1)


if __name__ == "__main__":
    main()