
import { JWT_SECRET } from "../config/env.js"
import { verifyJwt } from "../utils/jwt.utils.js"

import { userModel } from "../models/user.model.js"
import { parkingModel } from "../models/parking.model.js"

import { hasReservation } from "./reservation.controller.js"

export const findParking = async () => {
    const parking = await parkingModel.findOne({ active: false })
    return parking ? parking : null
}

export const isInside = async (userId) => {
    const user = await userModel.findById(userId)
    return user.active || user.parking !== "" ? true : false
}

export const parkingAccessController = async (io, socket, data) => {

    const { token, patente } = data
    const { uid } = verifyJwt(token, JWT_SECRET)

    const user = await userModel.findById(uid)

    if (!user) {
        socket.emit("parking-access-denied", {
            message: "Error interno"
        })

        return
    }

    const isIn = await isInside(user.id)

    if (isIn) {
        socket.emit("parking-access-denied", {
            message: "Ya te encuentras dentro de un estacionamiento"
        })

        return
    }

    const hasReserv = await hasReservation(user.id, patente)

    if (hasReserv) {
        socket.emit("parking-access-denied", {
            message: "Posees una reserva activa, confirma tu ingreso desde la sección de reservas"
        })

        return
    }

    const parking = await findParking()

    if (!parking) {
        socket.emit("parking-access-denied", {
            message: "No hay estacionamientos disponibles"
        })

        return
    }

    parking.active = true
    parking.status = "ocupado"
    await parking.save()

    user.active = true
    user.parking = parking.name
    await user.save()

    socket.emit("parking-access-ok", {
        message: `Entrada al estacionamiento ${parking.name} registrada con éxito`
    })

}

export const parkingExitController = async (io, socket, data) => {

    const { token } = data
    const { uid } = verifyJwt(token, JWT_SECRET)

    const user = await userModel.findById(uid)

    if (!user) {
        socket.emit("parking-exit-denied", {
            message: "Error interno"
        })

        return
    }

    const hasReserv = await hasReservation(user.id)

    if (hasReserv) {
        socket.emit("parking-exit-denied", {
            message: "No puedes marcar tu salida ya que posees una reserva activa, cancela tu reserva para poder salir"
        })

        return
    }

    const isIn = await isInside(user.id)

    if (!isIn) {
        socket.emit("parking-exit-denied", {
            message: "No puedes marcar tu salida ya que no te encuentras dentro de un estacionamiento"
        })

        return
    }

    const parking = await parkingModel.findOne({ name: user.parking })

    if (!parking) {
        socket.emit("parking-exit-denied", {
            message: "Error interno"
        })

        return
    }

    parking.active = false
    parking.status = "libre"
    await parking.save()

    user.active = false
    user.parking = ""
    await user.save()

    socket.emit("parking-exit-ok", {
        message: `Salida del estacionamiento ${parking.name} registrada con éxito`
    })
}