import os
import re
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.utils import secure_filename
from models import db, Region, Comuna, Voluntario, Ave, Avistamiento, Registro, Comentario

app = Flask(__name__)
app.config["SECRET_KEY"] = "clave-para-tarea2-cc5002"  # solo para flash messages
app.config["SQLALCHEMY_DATABASE_URI"] = (
    "mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2"
)
app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "static", "uploads")
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB máx. por request

db.init_app(app)

EXTENSIONES_PERMITIDAS = {"jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "avi", "webm"}
FILAS_POR_PAGINA = 5


# ---------- Funciones de validación server-side ----------
def email_es_valido(email):
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email or ""))


def telefono_es_valido(telefono):
    limpio = re.sub(r"\s+", "", telefono or "")
    return bool(re.match(r"^\+?569\d{8}$", limpio))


def fecha_hora_es_valida(fecha_hora):
    """Regla definida: no futura, no más de 1 año en el pasado."""
    ahora = datetime.now()
    hace_un_anio = ahora - timedelta(days=365)
    return hace_un_anio <= fecha_hora <= ahora


def extension_permitida(nombre_archivo):
    return "." in nombre_archivo and \
        nombre_archivo.rsplit(".", 1)[1].lower() in EXTENSIONES_PERMITIDAS


def guardar_archivo(archivo, avistamiento_id):
    nombre_seguro = secure_filename(archivo.filename)
    nombre_en_disco = f"{avistamiento_id}_{int(datetime.now().timestamp())}_{nombre_seguro}"
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    archivo.save(os.path.join(app.config["UPLOAD_FOLDER"], nombre_en_disco))
    return Registro(
        ruta_archivo=f"uploads/{nombre_en_disco}",
        nombre_archivo=nombre_seguro,
        avistamiento_id=avistamiento_id,
    )

def tiene_caracteres_no_soportados(texto):
    """La BD usa utf8, revisa que los caracteres no sean demaciado grandes
    lo que nos dice que son caracteres tipicos que si queremos"""
    return any(ord(caracter) > 0xFFFF for caracter in texto)


# ---------- Portada ----------
@app.route("/")
def index():
    ultimos_avistamientos = (
        Avistamiento.query.order_by(Avistamiento.fecha_hora.desc()).limit(2).all()
    )
    return render_template("index.html", avistamientos=ultimos_avistamientos)

# ---------- API auxiliar para la cascada región -> comuna ----------
@app.route("/api/comunas/<int:region_id>")
def api_comunas(region_id):
    comunas = Comuna.query.filter_by(region_id=region_id).order_by(Comuna.nombre).all()
    return jsonify([{"id": c.id, "nombre": c.nombre} for c in comunas])


# ---------- Registrar voluntario ----------
@app.route("/registrar-voluntario", methods=["GET", "POST"])
def registrar_voluntario():
    errores = {}
    valores = {"Nombre_completo": "", "Dir_electronico": "", "telefono": "", "region": "", "comuna": ""}

    if request.method == "POST":
        valores["Nombre_completo"] = request.form.get("Nombre_completo", "").strip()
        valores["Dir_electronico"] = request.form.get("Dir_electronico", "").strip()
        dir_electronico_repeat = request.form.get("Dir_electronico_repeat", "").strip()
        valores["telefono"] = request.form.get("telefono", "").strip()
        valores["region"] = request.form.get("region", "")
        valores["comuna"] = request.form.get("comuna", "")

        if len(valores["Nombre_completo"]) < 3 or len(valores["Nombre_completo"]) > 80:
            errores["Nombre_completo"] = "El nombre debe tener entre 3 y 80 caracteres."

        if not email_es_valido(valores["Dir_electronico"]):
            errores["Dir_electronico"] = "El correo no tiene un formato válido."
        elif valores["Dir_electronico"] != dir_electronico_repeat:
            errores["Dir_electronico"] = "Los correos no coinciden."

        if not telefono_es_valido(valores["telefono"]):
            errores["telefono"] = "Formato esperado: +56 9 1234 5678."

        comuna = Comuna.query.get(valores["comuna"]) if valores["comuna"] else None
        if comuna is None:
            errores["comuna"] = "Debes seleccionar una comuna válida."

        if not errores:
            nuevo_voluntario = Voluntario(
                nombre=valores["Nombre_completo"],
                email=valores["Dir_electronico"],
                telefono=valores["telefono"],
                fecha_registro=datetime.now(),
                comuna_id=comuna.id,
            )
            db.session.add(nuevo_voluntario)
            db.session.commit()
            flash("¡Voluntario registrado con éxito!", "exito")
            return redirect(url_for("registrar_avistamiento", voluntario_email=nuevo_voluntario.email))

    regiones = Region.query.order_by(Region.id).all()
    return render_template(
        "registrar_voluntario.html", errores=errores, valores=valores, regiones=regiones
    )


# ---------- Registrar avistamiento ----------
@app.route("/registrar-avistamiento", methods=["GET", "POST"])
def registrar_avistamiento():
    errores = {}
    valores = {
        "voluntario_email": request.values.get("voluntario_email", ""),
        "ave_id": "",
        "fecha_avistamiento": "",
        "hora_avistamiento": "",
        "lugar": "",
    }

    if request.method == "POST":
        valores["voluntario_email"] = request.form.get("voluntario_email", "").strip()
        valores["ave_id"] = request.form.get("ave_id", "")
        valores["fecha_avistamiento"] = request.form.get("fecha_avistamiento", "")
        valores["hora_avistamiento"] = request.form.get("hora_avistamiento", "")
        valores["lugar"] = request.form.get("lugar", "").strip()

        archivo_foto = request.files.get("foto_avistamiento")
        archivo_video = request.files.get("video_avistamiento")
        archivos = [a for a in (archivo_foto, archivo_video) if a and a.filename]

        # Identificación por email (sin contraseña ni sesión)
        voluntario = None
        if not email_es_valido(valores["voluntario_email"]):
            errores["voluntario_email"] = "Ingresa un correo válido."
        else:
            voluntario = Voluntario.query.filter_by(email=valores["voluntario_email"]).first()
            if voluntario is None:
                errores["voluntario_email"] = (
                    "Ese correo no está registrado. Debes registrarte como "
                    "voluntario antes de informar un avistamiento."
                )

        ave = Ave.query.get(valores["ave_id"]) if valores["ave_id"] else None
        if ave is None:
            errores["ave_id"] = "Debes seleccionar un ave válida."

        if len(valores["lugar"]) < 3:
            errores["lugar"] = "Indica el lugar del avistamiento."

        fecha_hora = None
        if valores["fecha_avistamiento"] and valores["hora_avistamiento"]:
            try:
                fecha_hora = datetime.strptime(
                    f"{valores['fecha_avistamiento']} {valores['hora_avistamiento']}", "%Y-%m-%d %H:%M"
                )
                if not fecha_hora_es_valida(fecha_hora):
                    errores["fecha_avistamiento"] = "La fecha/hora no puede ser futura ni de hace más de 1 año."
            except ValueError:
                errores["fecha_avistamiento"] = "Fecha u hora con formato inválido."
        else:
            errores["fecha_avistamiento"] = "Debes indicar fecha y hora."

        if not archivos:
            errores["archivos"] = "Debes adjuntar al menos una foto o un video."
        else:
            for archivo in archivos:
                if not extension_permitida(archivo.filename):
                    errores["archivos"] = "Formato de archivo no permitido."
                    break

        if not errores:
            nuevo_avistamiento = Avistamiento(
                voluntario_id=voluntario.id,
                ave_id=ave.id,
                fecha_hora=fecha_hora,
                lugar=valores["lugar"],
            )
            db.session.add(nuevo_avistamiento)
            db.session.flush()

            for archivo in archivos:
                db.session.add(guardar_archivo(archivo, nuevo_avistamiento.id))

            db.session.commit()
            flash("¡Avistamiento registrado con éxito!", "exito")
            return redirect(url_for("index"))

    aves = Ave.query.order_by(Ave.nombre).all()
    return render_template(
        "registrar_avistamiento.html",
        errores=errores, valores=valores, aves=aves,
    )


# ---------- Listado de avistamientos (paginado, filtrable, ordenable) ----------
@app.route("/listado-avistamientos")
def listado_avistamientos():
    pagina = request.args.get("pagina", 1, type=int)
    ave_id = request.args.get("ave_id", "", type=str)
    orden = request.args.get("orden", "fecha_desc", type=str)

    consulta = Avistamiento.query
    if ave_id:
        consulta = consulta.filter(Avistamiento.ave_id == ave_id)

    if orden == "fecha_asc":
        consulta = consulta.order_by(Avistamiento.fecha_hora.asc())
    elif orden == "lugar_asc":
        consulta = consulta.order_by(Avistamiento.lugar.asc())
    else:
        consulta = consulta.order_by(Avistamiento.fecha_hora.desc())

    paginacion = consulta.paginate(page=pagina, per_page=FILAS_POR_PAGINA, error_out=False)
    aves = Ave.query.order_by(Ave.nombre).all()
    return render_template(
        "listado_avistamientos.html",
        paginacion=paginacion, aves=aves, ave_id_actual=ave_id, orden_actual=orden,
    )


# ---------- Detalle de un avistamiento ----------
@app.route("/avistamiento/<int:avistamiento_id>")
def detalle_avistamiento(avistamiento_id):
    avistamiento = Avistamiento.query.get_or_404(avistamiento_id)
    return render_template("detalle_avistamiento.html", avistamiento=avistamiento)

# ---------- Estadísticas ----------
@app.route("/estadisticas")
def estadisticas():
    return render_template("estadisticas.html")
 
 
@app.route("/api/estadisticas/avistamientos-por-dia")
def api_avistamientos_por_dia():
    # func.date() descarta la hora de fecha_hora, así agrupamos por día.
    dia = func.date(Avistamiento.fecha_hora)
    filas = (
        db.session.query(dia, func.count(Avistamiento.id))
        .group_by(dia)
        .order_by(dia)
        .all()
    )
    return jsonify({
        "etiquetas": [str(fila[0]) for fila in filas],
        "valores": [fila[1] for fila in filas],
    })
 
 
@app.route("/api/estadisticas/avistamientos-por-ave")
def api_avistamientos_por_ave():
    # La tabla ave no tiene columna "tipo", así que se agrupa por ave.
    filas = (
        db.session.query(Ave.nombre, func.count(Avistamiento.id))
        .join(Avistamiento, Avistamiento.ave_id == Ave.id)
        .group_by(Ave.id, Ave.nombre)
        .order_by(func.count(Avistamiento.id).desc(), Ave.nombre)
        .all()
    )
    return jsonify({
        "etiquetas": [fila[0] for fila in filas],
        "valores": [fila[1] for fila in filas],
    })
 
 
@app.route("/api/estadisticas/voluntarios-por-comuna")
def api_voluntarios_por_comuna():
    # join interno: solo aparecen las comunas que tienen al menos un voluntario.
    filas = (
        db.session.query(Comuna.nombre, func.count(Voluntario.id))
        .join(Voluntario, Voluntario.comuna_id == Comuna.id)
        .group_by(Comuna.id, Comuna.nombre)
        .order_by(Comuna.nombre)
        .all()
    )
    return jsonify({
        "etiquetas": [fila[0] for fila in filas],
        "valores": [fila[1] for fila in filas],
    })

# ---------- Comentarios de un avistamiento (API JSON) ----------
def comentario_a_dict(comentario):
    return {
        "id": comentario.id,
        "nombre": comentario.nombre,
        "texto": comentario.texto,
        "fecha": comentario.fecha.strftime("%d-%m-%Y %H:%M"),
    }
 
 
@app.route("/api/avistamiento/<int:avistamiento_id>/comentarios", methods=["GET"])
def api_listar_comentarios(avistamiento_id):
    if db.session.get(Avistamiento, avistamiento_id) is None:
        return jsonify({"ok": False, "errores": {"general": "El avistamiento no existe."}}), 404
 
    comentarios = (
        Comentario.query.filter_by(avistamiento_id=avistamiento_id)
        .order_by(Comentario.fecha.desc(), Comentario.id.desc())
        .all()
    )
    return jsonify([comentario_a_dict(c) for c in comentarios])
 
 
@app.route("/api/avistamiento/<int:avistamiento_id>/comentarios", methods=["POST"])
def api_agregar_comentario(avistamiento_id):
    if db.session.get(Avistamiento, avistamiento_id) is None:
        return jsonify({"ok": False, "errores": {"general": "El avistamiento no existe."}}), 404
 
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return jsonify({"ok": False, "errores": {"general": "Solicitud inválida."}}), 400
 
    # Cualquier valor que no sea texto se trata como vacío (así un null o un
    # número en el JSON no se cuela como un nombre válido).
    nombre = datos.get("nombre")
    texto = datos.get("texto")
    nombre = nombre.strip() if isinstance(nombre, str) else ""
    texto = texto.strip() if isinstance(texto, str) else ""
 
    # Mismas reglas que en el JS (el servidor no confía en el navegador).
    # El máximo de 300 en el texto viene de la columna VARCHAR(300) de la BD.
    errores = {}
    if not 3 <= len(nombre) <= 50:
        errores["nombre"] = "El nombre debe tener entre 3 y 50 caracteres."
    elif tiene_caracteres_no_soportados(nombre):
        errores["nombre"] = "El nombre contiene caracteres no soportados (por ejemplo, emojis)."
    if not 5 <= len(texto) <= 300:
        errores["texto"] = "El comentario debe tener entre 5 y 300 caracteres."
    elif tiene_caracteres_no_soportados(texto):
        errores["texto"] = "El comentario contiene caracteres no soportados (por ejemplo, emojis)."
    if errores:
        return jsonify({"ok": False, "errores": errores}), 400
 
    comentario = Comentario(
        nombre=nombre, texto=texto, fecha=datetime.now(), avistamiento_id=avistamiento_id
    )
    try:
        db.session.add(comentario)
        db.session.commit()
    except SQLAlchemyError:
        # Red de seguridad: si la BD rechaza el INSERT por cualquier motivo,
        # se responde con JSON (el JS lo muestra) en vez de una página de error.
        db.session.rollback()
        return jsonify({"ok": False, "errores": {
            "general": "No se pudo guardar el comentario. Intenta de nuevo."}}), 500
    return jsonify({"ok": True, "comentario": comentario_a_dict(comentario)}), 201


if __name__ == "__main__":
    app.run(debug=True)