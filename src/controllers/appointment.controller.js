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

  const pendingAppointment = await Appointment.findOne({
    $or: [
      {
        $and: [
          { scheduler: user._id },
          { participant: participant },
          { status: { $in: ["pending"] } },
        ],
      },
      {
        $and: [
          { participant: user._id },
          { scheduler: participant },
          { status: { $in: ["pending"] } },
        ],
      },
    ],
  });

  if (pendingAppointment) {
    throw new ApiError(400, "You have a pending appointment with this person");
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

  await Appointment.findByIdAndDelete(appointmentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Appointment cancelled successfully",
    data: null,
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
  const { search, status, date_filter, type, page = 1, limit = 10 } = req.query;

  const query = {};

  // Filter by scheduler or participant
  if (type === "scheduler") {
    query.scheduler = req.user._id;
  } else if (type === "participant") {
    query.participant = req.user._id;
  } else {
    query.$or = [{ scheduler: req.user._id }, { participant: req.user._id }];
  }

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
  if (date_filter === "upcoming") {
    query.dateTime = { $gte: currentDate };
  } else if (date_filter === "past") {
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
  const { dateTime } = req.body;

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
    dateTime: dateTime || appointment.dateTime,
  };

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    {
      $set: updateData,
    },
    {
      new: true,
      runValidators: true,
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
