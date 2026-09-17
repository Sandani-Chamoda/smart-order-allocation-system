const {
  execFile,
} = require("child_process");

const path = require("path");

const classifyMessage = (message) => {
  return new Promise((resolve) => {
    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      resolve(null);
      return;
    }

    const classifierPath = path.resolve(
      __dirname,
      "../../../ai-service/classifier.py"
    );

    const pythonCommand =
      process.env.PYTHON_COMMAND || "py";

    execFile(
      pythonCommand,
      [
        classifierPath,
        message.trim(),
      ],
      {
        timeout: 10000,
        windowsHide: true,
      },
      (error, stdout) => {
        if (error) {
          console.error(
            "AI classification failed:",
            error.message
          );

          // AI is a bonus feature.
          // An AI failure must not prevent
          // the customer from placing an order.
          resolve(null);
          return;
        }

        try {
          const result = JSON.parse(
            stdout.trim()
          );

          if (
            !result.category ||
            typeof result.confidence !==
              "number"
          ) {
            resolve(null);
            return;
          }

          resolve({
            category: result.category,
            confidence:
              result.confidence,
            lowConfidence:
              Boolean(
                result.lowConfidence
              ),
          });
        } catch (parseError) {
          console.error(
            "Invalid AI classifier response:",
            parseError.message
          );

          resolve(null);
        }
      }
    );
  });
};

module.exports = classifyMessage;