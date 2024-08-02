const express = require("express");
const AppointmentController = require("../../controllers/appointment.controller.js");
const authGuard = require("../../middleware/authGuard.js");

const router = express.Router();

router
  .route("/")
  .post(authGuard(), AppointmentController.createAppointment)
  .get(authGuard(), AppointmentController.getAppointments);

router
  .route("/:appointmentId")
  .get(authGuard(), AppointmentController.getAppointment)
  .patch(authGuard(), AppointmentController.updateAppointment);

router
  .route("/:appointmentId/cancel")
  .patch(authGuard(), AppointmentController.cancelAppointment);

router
  .route("/:appointmentId/accept")
  .patch(authGuard(), AppointmentController.acceptAppointment);

router
  .route("/:appointmentId/decline")
  .patch(authGuard(), AppointmentController.declineAppointment);

module.exports = router;
