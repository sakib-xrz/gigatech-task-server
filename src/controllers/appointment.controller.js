const catchAsync = require("../utils/catchAsync.js");
const sendResponse = require("../utils/sendResponse.js");

const ApiError = require("../error/ApiError.js");

const Appointment = require("../models/appointment.model.js");

const createAppointment = catchAsync(async (req, res) => {
  const { title, description, dateTime, audioMessage, participant } = req.body;
  const { user } = req;

  if (!title || !dateTime || !participant) {
    throw new ApiError(400, "Title, dateTime and participant are required");
  }

  const appointmentData = {
    title,
    description,
    dateTime,
    participant,
    scheduler: user._id,
    audioMessage: audioMessage || "",
  };

  const appointment = await Appointment.create(appointmentData);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Appointment created successfully",
    data: {
      appointment,
    },
  });
});

const cancelAppointment = catchAsync(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.scheduler.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to cancel this appointment"
    );
  }

  if (appointment.dateTime < new Date()) {
    throw new ApiError(400, "Appointment has already passed");
  }

  if (appointment.status === "cancelled") {
    throw new ApiError(400, "Appointment is already cancelled");
  }

  appointment.status = "cancelled";
  await appointment.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Appointment cancelled successfully",
    data: {
      appointment,
    },
  });
});

const acceptAppointment = catchAsync(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.participant.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to accept this appointment"
    );
  }

  if (appointment.status === "accepted") {
    throw new ApiError(400, "Appointment is already accepted");
  }

  appointment.status = "accepted";

  await appointment.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Appointment accepted successfully",
    data: {
      appointment,
    },
  });
});

const declineAppointment = catchAsync(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.participant.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to decline this appointment"
    );
  }

  if (appointment.status === "declined") {
    throw new ApiError(400, "Appointment is already declined");
  }

  appointment.status = "declined";
  await appointment.save();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Appointment declined successfully",
    data: {
      appointment,
    },
  });
});

const getAppointments = catchAsync(async (req, res) => {
  const { search, status, dateFilter, page = 1, limit = 10 } = req.query;
  const query = {
    $or: [{ scheduler: req.user._id }, { participant: req.user._id }],
  };

  // Search by title
  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Distinguish between upcoming and past appointments
  const currentDate = new Date();
  if (dateFilter === "upcoming") {
    query.dateTime = { $gte: currentDate };
  } else if (dateFilter === "past") {
    query.dateTime = { $lt: currentDate };
  }

  // Pagination
  const skip = (page - 1) * limit;

  let appointments = await Appointment.find(query)
    .populate([
      { path: "scheduler", select: "-createdAt -updatedAt" },
      { path: "participant", select: "-createdAt -updatedAt" },
    ])
    .skip(skip)
    .limit(Number(limit))
    .select("-description -audioMessage");

  appointments = appointments.map((appointment) => {
    const isScheduler =
      appointment.scheduler.toString() === req.user._id.toString();
    return {
      ...appointment._doc,
      isScheduler,
    };
  });

  const total = await Appointment.countDocuments(query);
  const count = appointments.length;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    meta: {
      page: Number(page),
      limit: Number(limit),
      count,
      total,
    },
    message: "Appointments retrieved successfully",
    data: {
      appointments,
    },
  });
});

const getAppointment = catchAsync(async (req, res) => {
  const { appointmentId } = req.params;

  let appointment = await Appointment.findOne({
    _id: appointmentId,
    $or: [{ scheduler: req.user._id }, { participant: req.user._id }],
  }).populate([
    { path: "scheduler", select: "-createdAt -updatedAt" },
    { path: "participant", select: "-createdAt -updatedAt" },
  ]);

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  const isScheduler = appointment.scheduler._id.toString() === req.user._id;

  appointment = {
    ...appointment._doc,
    isScheduler,
  };

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Appointment retrieved successfully",
    data: {
      appointment,
    },
  });
});

const updateAppointment = catchAsync(async (req, res) => {
  const { appointmentId } = req.params;
  const { title, description, dateTime, audioMessage } = req.body;

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.scheduler.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update this appointment"
    );
  }

  const updateData = {
    title: title || appointment.title,
    description: description || appointment.description,
    dateTime: dateTime || appointment.dateTime,
    audioMessage: audioMessage || appointment.audioMessage,
  };

  const updatedAppointment = await appointment.findByIdAndUpdate(
    appointmentId,
    {
      $set: updateData,
    },
    {
      new: true,
    }
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Appointment updated successfully",
    data: {
      appointment: updatedAppointment,
    },
  });
});

const AppointmentController = {
  createAppointment,
  cancelAppointment,
  acceptAppointment,
  declineAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
};

module.exports = AppointmentController;
