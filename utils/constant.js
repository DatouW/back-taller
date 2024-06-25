const INICIAR_SESION = "Iniciar Sesion";
const REGISTRAR_USUARIO = "Registrarse Como Usuario";
const PUBLICAR_PREGUNTA = "Publicar pregunta";
const PUBLICAR_RESPUESTA = "Responder a la pregunta";
const COMPARTIR_RECURSO = "Compartir recurso";
const ELIMINAR_PREGUNTA = "Pregunta eliminada por administrador";
const ELIMINAR_RECURSO = "Recurso eliminado por administrador";

const Points = {
  PUBLICAR_PREGUNTA: -5,
  PUBLICAR_RESPUESTA: 5,
  REGISTRAR_USUARIO: 10,
  INICIAR_SESION: 2,
  COMPARTIR_RECURSO: 10,
  DELETE_PREGUNTA: -10,
  DELETE_RECURSO: -15,
};

const Status = {
  SUBMITTED: "Enviado",
  PENDING_REVIEW_F: "Pendiente.",
  PENDING_REVIEW: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  PROCESSED: "Procesado",
};

module.exports = {
  INICIAR_SESION,
  REGISTRAR_USUARIO,
  Status,
  PUBLICAR_PREGUNTA,
  PUBLICAR_RESPUESTA,
  COMPARTIR_RECURSO,
  Points,
  ELIMINAR_PREGUNTA,
  ELIMINAR_RECURSO,
};
