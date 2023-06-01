const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')

const app = express()

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next()
})

app.use(bodyParser.json())

const PUERTO = 4500

const conexion = mysql.createConnection(
    {
        host:'localhost',
        database:'AppMaterias',
        user:'root',
        password:'claymrx'
    }
)

app.listen(PUERTO, () => {
    console.log(`Servidor corriendo en el puerto ${PUERTO}`);
})

conexion.connect(error => {
    if(error) throw error
    console.log('Conexión exitosa a la base de datos');
})

app.get('/', (req, res) => {
    res.send('API')
})

////Obtener maestros
app.get('/maestros',(req, res)=> {
    const query = `
        SELECT no_emp, nombres AS nombre, ap_paterno, ap_materno, horas_impartir, tipo_plaza FROM profesores;
    `
    const maestrosDB = conexion.query(query, (error, resultado) => {
      if(error) return console.error(error.message)
  
      if(resultado.length > 0) {
          res.json(resultado)
      } else {
          res.json(`No hay registros`)
      }
    })
    return maestrosDB;
});

//Obtener horario de un maestro en especifio
app.get('/maestros/:id/horario',(req, res) => {
    const { id } = req.params
    const query = `
    SELECT no_emp, dia, hi AS horaInicio, hf AS horaFin from horario_disponible_profesor WHERE no_emp = ${id}`;

    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
});

app.get('/maestros/:id/horario/:dia',(req, res) => {
    const { id, dia } = req.params
    const query = `
    Select hi AS horaInicio, hf AS horaFIn from horario_disponible_profesor WHERE no_emp=${id} AND dia = "${dia}";
    `;

    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
})

app.get('/maestros/horario',(req, res) => {
    const { id } = req.params
    const query = `
    SELECT no_emp, dia, hi AS horaInicio, hf AS horaFin from horario_disponible_profesor;
    `;

    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
});

app.get('/maestros/horario/:id',(req, res) => {
    const { id } = req.params
    const query = `
    SELECT dia, hi AS horaInicio, hf AS horaFin from horario_disponible_profesor WHERE no_emp = ${id};
    `;

    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
});

app.get('/materias/profesor',(req, res) => {
    const { id } = req.params
    const query = `
    SELECT no_emp, cve_materia from materias_profesor;
    `;

    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
});

app.get('/materias/profesor/:id',(req, res) => {
    const { id } = req.params
    const query = `
    SELECT cve_materia from materias_profesor WHERE no_emp = ?;
    `;
    conexion.query(query,[id], (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
});

// Dia, horaInicio, horaFin, de todos los dias de la semana
app.get(`/materias/:id/:grupo/horario`,(req, res) => {
    const { id, grupo } = req.params
    const query = `
        SELECT dia,hi AS horaInicio, hf AS horaFin FROM grupos_ofertados WHERE id_materia = ${id} AND grupo = "${grupo}";
    `;

    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
})

//Materias ofertadas, id, grupo
app.get('/materias/grupos',(req, res)=>{ 
    const query = `SELECT * from materias_ofertadas WHERE asignada = 0`;
    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
});

app.get('/materias/grupos/:id',(req, res)=>{ 
    const {id} = req.params;
    const query = `SELECT asignada,no_emp,grupo from materias_ofertadas WHERE asignada = 0 AND id_materia = ${id}`;
    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
});

//Obtener mas datos de un grupo (horario)
app.get('/materias/:id/:grupo',(req, res)=>{
    const { id, grupo } = req.params
    const query = `SELECT * from grupos_ofertados WHERE id_materia = ${id} AND grupo = "${grupo}"`;
    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
})

app.get('/materias/:id/:grupo/salon',(req, res)=>{
    const { id, grupo } = req.params
    const query = `SELECT salon from grupos_ofertados WHERE id_materia = ${id} AND grupo = "${grupo}" LIMIT 1`;
    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
})

app.get('/materias',(req, res)=>{
    const query = `SELECT mf.id_materia,
    (SELECT cve_materia FROM materias AS m WHERE m.id_materia = mf.id_materia ) AS codigo,
    (SELECT descripcion FROM materias AS m WHERE m.id_materia = mf.id_materia ) AS titulo,
    (SELECT creditos FROM materias AS m WHERE m.id_materia = mf.id_materia ) AS creditos,
    (SELECT id_reticula FROM materias AS m WHERE m.id_materia = mf.id_materia ) AS reticula,
    (SELECT salon FROM grupos_ofertados AS gf WHERE gf.id_materia = mf.id_materia LIMIT 1) AS salon,
    mf.asignada AS enable, mf.no_emp AS profesorAsignado, mf.grupo FROM materias_ofertadas AS mf;`;
    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
})



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