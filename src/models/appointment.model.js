const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    dateTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
    },
    audioMessage: {
      type: String,
    },
    scheduler: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
    participant: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

appointmentSchema.virtual("isDueDateExceeded").get(function () {
  return this.dateTime < new Date();
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
