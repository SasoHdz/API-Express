const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const util = require("util");
const promisify = util.promisify;
const ExcelJS = require('exceljs');


const app = express();

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bodyParser.json());

const PUERTO = 4500;

const conexion = mysql.createConnection({
  host: "localhost",
  database: "AppMaterias",
  user: "root",
  password: "claymrx",
});

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en el puerto ${PUERTO}`);
});

conexion.connect((error) => {
  if (error) throw error;
  console.log("Conexión exitosa a la base de datos");
});

app.get("/", (req, res) => {
  res.send("API");
});

function formatTime(h) {
  let x;
  h <= 9 ? (x = `0${h.toString()}:00`) : (x = `${h.toString()}:00`);
  return x;
}

function obtenerMateriasProfe(id) {
  return new Promise((resolve, reject) => {
    const query = `Select DISTINCT cve_materia from materias_profesor WHERE no_emp = ?`;
    conexion.query(query, [id], (error, resultados) => {
      if (error) {
        reject(error);
      } else {
        let materias = [];
        for (let r of resultados) {
          materias.push(r.cve_materia);
        }
        resolve(materias);
      }
    });
  });
}

function obtenerHorarioProfe(id) {
  return new Promise((resolve, reject) => {
    const query = `SELECT no_emp, dia, hi AS horaInicio, hf AS horaFin from horario_disponible_profesor WHERE no_emp = ?`;
    conexion.query(query, [id], (error, resultados) => {
      if (error) {
        reject(error);
      } else {
        let horario = {
          LUNES: [],
          MARTES: [],
          MIERCOLES: [],
          JUEVES: [],
          VIERNES: [],
        };
        for (let r of resultados) {
          const { dia, horaInicio, horaFin } = r;
          if (!horario[dia]) {
            horario[dia] = [];
          }
          horario[dia].push({
            horaInicio: formatTime(horaInicio),
            horaFin: formatTime(horaFin),
          });
        }
        resolve(horario);
      }
    });
  });
}

function obtenerMateriasAsignadasProfe(id) {
  return new Promise((resolve, reject) => {
    const query = `SELECT id_materia,grupo FROM materias_ofertadas WHERE no_emp = ?`;
    conexion.query(query, [id], (error, resultados) => {
      if (error) {
        reject(error);
      } else {
        let materias = [];
        for (let r of resultados) {
          const { id_materia, grupo } = r;
          materias.push({
            ...r,
          });
        }
        resolve(materias);
      }
    });
  });
}

async function obtenerMaestros() {
  try {
    const query = `SELECT no_emp AS noEmp, nombres AS nombre, ap_paterno, ap_materno, tipo_plaza AS tipo, horas_impartir FROM profesores`;
    const resultados = await promisify(conexion.query).call(conexion, query);

    const maestrosMap = new Map();

    for (const r of resultados) {
      const { noEmp } = r;
      const materias = await obtenerMateriasProfe(noEmp);
      const horaDisp = await obtenerHorarioProfe(noEmp);
      const mAsginadas = await obtenerMateriasAsignadasProfe(noEmp);

      if (!maestrosMap.has(noEmp)) {
        maestrosMap.set(noEmp, {
          ...r,
          hrsEnableWeek: horaDisp,
          materiasImpartir: materias,
          materiasAsignadas: mAsginadas,
        });
      }
    }

    const profes = Array.from(maestrosMap.values());
    return profes;
  } catch (error) {
    throw error;
  }
}

app.get("/maestros", async (req, res) => {
  try {
    const maestros = await obtenerMaestros();
    res.json(maestros);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

//Obtener horario de un maestro en especifio
app.get("/maestros/:id/horario", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT no_emp, dia, hi AS horaInicio, hf AS horaFin from horario_disponible_profesor WHERE no_emp = ${id}`;

  conexion.query(query, (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

app.get("/maestros/:id/horario/:dia", (req, res) => {
  const { id, dia } = req.params;
  const query = `
    Select hi AS horaInicio, hf AS horaFIn from horario_disponible_profesor WHERE no_emp=${id} AND dia = "${dia}";
    `;

  conexion.query(query, (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

app.get("/maestros/horario", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT no_emp, dia, hi AS horaInicio, hf AS horaFin from horario_disponible_profesor;
    `;

  conexion.query(query, (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

app.get("/maestros/horario/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT dia, hi AS horaInicio, hf AS horaFin from horario_disponible_profesor WHERE no_emp = ${id};
    `;

  conexion.query(query, (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

app.get("/materias/profesor", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT no_emp, cve_materia from materias_profesor;
    `;

  conexion.query(query, (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

app.get("/materias/profesor/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT cve_materia from materias_profesor WHERE no_emp = ?;
    `;
  conexion.query(query, [id], (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

function obtenerHorarioMateria(id, grupo) {
  return new Promise((resolve, reject) => {
    const query = `SELECT dia,hi AS horaInicio, hf AS horaFin FROM grupos_ofertados WHERE id_materia = ? AND grupo = ?;`;
    conexion.query(query, [id, grupo], (error, resultados) => {
      if (error) {
        reject(error);
      } else {
        let horario = {
          LUNES: { horaInicio: "", horaFin: "" },
          MARTES: { horaInicio: "", horaFin: "" },
          MIERCOLES: { horaInicio: "", horaFin: "" },
          JUEVES: { horaInicio: "", horaFin: "" },
          VIERNES: { horaInicio: "", horaFin: "" },
        };
        for (let r of resultados) {
          const { dia, horaInicio, horaFin } = r;
          horario[dia] = {
            horaInicio: formatTime(horaInicio),
            horaFin: formatTime(horaFin),
          };
        }
        resolve(horario);
      }
    });
  });
}

async function obtenerMaterias() {
  try {
    const query = `SELECT mf.id_materia,
        (SELECT cve_materia FROM materias AS m WHERE m.id_materia = mf.id_materia ) AS codigo,
        (SELECT descripcion FROM materias AS m WHERE m.id_materia = mf.id_materia ) AS titulo,
        (SELECT creditos FROM materias AS m WHERE m.id_materia = mf.id_materia ) AS creditos,
        (SELECT id_reticula FROM materias AS m WHERE m.id_materia = mf.id_materia ) AS reticula,
        (SELECT salon FROM grupos_ofertados AS gf WHERE gf.id_materia = mf.id_materia LIMIT 1) AS salon,
        mf.asignada AS enable, mf.no_emp AS profesorAsignado, mf.grupo FROM materias_ofertadas AS mf WHERE mf.asignada=0;`;
    const resultados = await promisify(conexion.query).call(conexion, query);
    const materiasMap = new Map();

    for (const r of resultados) {
      const { id_materia, grupo } = r;
      const materias = await obtenerHorarioMateria(id_materia, grupo);

      if (!materiasMap.has(id_materia)) {
        materiasMap.set(id_materia + grupo, {
          ...r,
          enable: r.enable === 0 ? false : true,
          horarioSemana: materias,
        });
      }
    }

    const newMaterias = Array.from(materiasMap.values());
    return newMaterias;
  } catch (error) {
    throw error;
  }
}

async function obtenerMateria(id_materia, grupo) {
  try {
    const query = `SELECT 
        (SELECT descripcion FROM materias AS m WHERE m.id_materia = mf.id_materia ) AS titulo,
        (SELECT salon FROM grupos_ofertados AS gf WHERE gf.id_materia = mf.id_materia LIMIT 1) AS salon,
         mf.grupo FROM materias_ofertadas AS mf WHERE mf.id_materia = ${id_materia} AND mf.grupo = ${grupo};`;
    const resultados = await promisify(conexion.query).call(conexion, query);
    const materiasMap = new Map();

    for (const r of resultados) {
      const { id_materia, grupo } = r;
      const materias = await obtenerHorarioMateria(id_materia, grupo);

      if (!materiasMap.has(id_materia)) {
        materiasMap.set(id_materia + grupo, {
          ...r,
          horarioSemana: materias,
        });
      }
    }

    const newMaterias = Array.from(materiasMap.values());
    return newMaterias;
  } catch (error) {
    throw error;
  }
}

app.get("/materias", async (req, res) => {
  try {
    const materias = await obtenerMaterias();
    res.json(materias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// Dia, horaInicio, horaFin, de todos los dias de la semana
app.get(`/materias/:id/:grupo/horario`, (req, res) => {
  const { id, grupo } = req.params;
  const query = `
        SELECT dia,hi AS horaInicio, hf AS horaFin FROM grupos_ofertados WHERE id_materia = ${id} AND grupo = "${grupo}";
    `;

  conexion.query(query, (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

//Materias ofertadas, id, grupo
app.get("/materias/grupos", (req, res) => {
  const query = `SELECT * from materias_ofertadas WHERE asignada = 0`;
  conexion.query(query, (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

app.get("/materias/grupos/:id", (req, res) => {
  const { id } = req.params;
  const query = `SELECT asignada,no_emp,grupo from materias_ofertadas WHERE asignada = 0 AND id_materia = ${id}`;
  conexion.query(query, (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

//Obtener mas datos de un grupo (horario)
app.get("/materias/:id/:grupo", (req, res) => {
  const { id, grupo } = req.params;
  const query = `SELECT * from grupos_ofertados WHERE id_materia = ${id} AND grupo = "${grupo}"`;
  conexion.query(query, (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

app.get("/materias/:id/:grupo/salon", (req, res) => {
  const { id, grupo } = req.params;
  const query = `SELECT salon from grupos_ofertados WHERE id_materia = ${id} AND grupo = "${grupo}" LIMIT 1`;
  conexion.query(query, (error, resultado) => {
    if (error) return console.error(error.message);

    if (resultado.length > 0) {
      res.json(resultado);
    } else {
      res.json(`No hay registros`);
    }
  });
});

async function ingresarHoraGrupo(id_materia, salon, grupo, dia, hi, hf) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO grupos_ofertados(id_materia, dia, hi, hf, salon, grupo) VALUES (?, ?, ?, ?, ?, ?)`;
    conexion.query(query, [id_materia, dia, hi, hf, salon, grupo], (error, resultados) => {
      if (error) {
        console.error(error.message);
        reject("Error en el servidor");
      } else {
        resolve("Se creo un grupo con exito");
      }
    });
  });
}

async function ingresarGrupo(id_materia, grupo) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO materias_ofertadas(id_materia, grupo) VALUES (?, ?)`;
    conexion.query(query, [id_materia, grupo], (error, resultados) => {
      if (error) {
        console.error(error.message);
        reject("Error en el servidor");
      } else {
        resolve("Se creo con exito");
      }
    });
  });
}

app.post("/grupo/agregar",async (req, res) => {
  const {
    id_materia,
    grupo,
    salon,
    horarioSemana,
  } = req.body;

  try {

    await ingresarGrupo(id_materia,grupo);
    await ingresarHoraGrupo(id_materia,salon,grupo,"LUNES",horarioSemana.LUNES.hi,horarioSemana.LUNES.hf);
    await ingresarHoraGrupo(id_materia,salon,grupo,"MARTES",horarioSemana.MARTES.hi,horarioSemana.MARTES.hf);
    await ingresarHoraGrupo(id_materia,salon,grupo,"MIERCOLES",horarioSemana.MIERCOLES.hi,horarioSemana.MIERCOLES.hf);
    await ingresarHoraGrupo(id_materia,salon,grupo,"JUEVES",horarioSemana.JUEVES.hi,horarioSemana.JUEVES.hf);
    await ingresarHoraGrupo(id_materia,salon,grupo,"VIERNES",horarioSemana.VIERNES.hi,horarioSemana.VIERNES.hf);

    res.json();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

function asignarMateria(no_emp,id_materia,grupo){
  return new Promise((resolve, reject) => {
    const query = `
    UPDATE materias_ofertadas
    SET asignada = 1, no_emp = ?
    WHERE id_materia = ? AND grupo = ?;
    `;
    conexion.query(query, [no_emp,id_materia,grupo], (error, resultados) => {
      if (error) {
        reject(error);
      } else {
        resolve("Listo");
      }
    });
  });
}

app.put('/grupos/asignar', async (req, res) => {
  const datos = req.body; // Asumiendo que los datos se encuentran en req.body

  try {
    await Promise.all(datos.map(async (g) => {
      await Promise.all(g.materias.map(async (m) => {
        await asignarMateria(g.no_emp, m.id_materia, m.grupo);
      }));
    }));

    res.json({ mensaje: "Actualización exitosa" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en la actualización" });
  }
});

async function obtenerMaestro(id) {
  try {
    const query = `SELECT nombres AS nombre, ap_paterno, ap_materno, tipo_plaza AS tipo FROM profesores WHERE no_emp = ${id}`;
    const resultados = await promisify(conexion.query).call(conexion, query);
    const maestro = {
      nombre: resultados.nombres + " " + resultados.ap_paterno,
      plaza: resultados.tipo,
    }
    return profes;
  } catch (error) {
    throw error;
  }
}

async function datosParaExcel(req){
  const excel = new Map();
  for(let m of req){
    const maestro = await obtenerMaestro(m.no_emp);
    let materias = [];
    for(let ma of m.materias){
      const x = await obtenerMateria(ma.id_materia, ma.grupo);
      materias.push({
        ...x
      })
    }
    excel.set(maestro.id+maestro.nombre,{
      ...maestro,
      materias : materias
    })
  }

  const datosX = Array.from(excel.values());
  return datosX;
}

function generarExcel(req, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Datos');

  const datos = req.body;

  // Establece los encabezados de la tabla
  const encabezados = ['Nombre', 'No. Empleado', 'Plaza'];
  worksheet.getRow(1).values = encabezados;

  // Establece los valores de los encabezados
  const valoresEncabezados = [datos.nombre, datos.no_emp, datos.plaza];
  worksheet.getRow(2).values = valoresEncabezados;

  // Establece los encabezados de las columnas de materias
  const encabezadosMaterias = ['Código', 'Título', 'Salón', 'Grupo', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
  worksheet.getRow(4).values = encabezadosMaterias;

  // Establece los valores de las materias
  let rowIndex = 5;
  for (const materia of datos.materias) {
    const filaMateria = [
      materia.codigo,
      materia.titulo,
      materia.salon,
      materia.grupo,
      materia.horarioSemana.LUNES.horaInicio,
      materia.horarioSemana.MARTES.horaInicio,
      materia.horarioSemana.MIERCOLES.horaInicio,
      materia.horarioSemana.JUEVES.horaInicio,
      materia.horarioSemana.VIERNES.horaInicio
    ];
    worksheet.getRow(rowIndex).values = filaMateria;
    rowIndex++;
  }

  // Establece el ancho de las columnas
  const columnas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  for (const columna of columnas) {
    worksheet.getColumn(columna).width = 12;
  }

  // Genera el archivo Excel y envíalo como respuesta
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=datos.xlsx');

  workbook.xlsx.write(res)
    .then(() => {
      res.end();
    })
    .catch((error) => {
      console.error('Error al generar el archivo Excel:', error);
      res.status(500).json({ mensaje: 'Error al generar el archivo Excel' });
    });
}

// Ruta para generar el archivo Excel
app.post('/generar-excel', (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const datos = req.body;
  datos.forEach((elemento) => {
    const worksheet = workbook.addWorksheet(`Maestro ${elemento.no_emp}`);

    worksheet.columns = [
      { header: 'Título', key: 'titulo' },
      { header: 'Grupo', key: 'grupo' },
      { header: 'Hora Inicio Lunes', key: 'horaInicioLunes' },
      { header: 'Hora Fin Lunes', key: 'horaFinLunes' },
      { header: 'Hora Inicio Martes', key: 'horaInicioMartes' },
      { header: 'Hora Fin Martes', key: 'horaFinMartes' },
      { header: 'Hora Inicio Miércoles', key: 'horaInicioMiercoles' },
      { header: 'Hora Fin Miércoles', key: 'horaFinMiercoles' },
      { header: 'Hora Inicio Jueves', key: 'horaInicioJueves' },
      { header: 'Hora Fin Jueves', key: 'horaFinJueves' },
      { header: 'Hora Inicio Viernes', key: 'horaInicioViernes' },
      { header: 'Hora Fin Viernes', key: 'horaFinViernes' },
    ];

    elemento.materias.forEach((materia) => {
      worksheet.addRow({
        titulo: materia.titulo,
        grupo: materia.grupo,
        horaInicioLunes: materia.horarioSemana.LUNES.horaInicio,
        horaFinLunes: materia.horarioSemana.LUNES.horaFin,
        horaInicioMartes: materia.horarioSemana.MARTES.horaInicio,
        horaFinMartes: materia.horarioSemana.MARTES.horaFin,
        horaInicioMiercoles: materia.horarioSemana.MIERCOLES.horaInicio,
        horaFinMiercoles: materia.horarioSemana.MIERCOLES.horaFin,
        horaInicioJueves: materia.horarioSemana.JUEVES.horaInicio,
        horaFinJueves: materia.horarioSemana.JUEVES.horaFin,
        horaInicioViernes: materia.horarioSemana.VIERNES.horaInicio,
        horaFinViernes: materia.horarioSemana.VIERNES.horaFin,
      });
    });
  });

  workbook.xlsx.write(res)
    .then(() => {
    /*   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=maestros.xlsx'); */
      res.end();
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error al generar el archivo de Excel');
    });
});






/* 
app.post('/usuarios/agregar', (req, res) => {
    const usuario = {
        nombre: req.body.nombre,
        email: req.body.email
    }

    const query = `INSERT INTO usuarios SET ?`
    conexion.query(query, usuario, (error) => {
        if(error) return console.error(error.message)

        res.json(`Se insertó correctamente el usuario`)
    })
})

app.put('/usuarios/actualizar/:id', (req, res) => {
    const { id } = req.params
    const { nombre, email } = req.body

    const query = `UPDATE usuarios SET nombre='${nombre}', email='${email}' WHERE id_usuario='${id}';`
    conexion.query(query, (error) => {
        if(error) return console.error(error.message)

        res.json(`Se actualizó correctamente el usuario`)
    })
})

app.delete('/usuarios/borrar/:id', (req, res) => {
    const { id } = req.params

    const query = `DELETE FROM usuarios WHERE id_usuario=${id};`
    conexion.query(query, (error) => {
        if(error) console.error(error.message)

        res.json(`Se eliminó correctamente el usuario`)
    })
}) */
