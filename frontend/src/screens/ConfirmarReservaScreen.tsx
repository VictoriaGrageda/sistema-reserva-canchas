import React from "react";
import type { NavProps } from "../navigation/types";
import ConfirmarReservaDiariaScreen from "./ConfirmarReservaDiariaScreen";
import ConfirmarReservaMensualScreen from "./ConfirmarReservaMensualScreen";

export default function ConfirmarReservaScreen(props: NavProps<"ConfirmarReserva">) {
  const tipo = props.route.params.tipoReserva || "diaria";
  if (tipo === "mensual") {
    return <ConfirmarReservaMensualScreen {...props} />;
  }
  return <ConfirmarReservaDiariaScreen {...props} />;
}
