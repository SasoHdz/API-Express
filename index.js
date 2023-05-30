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
        SELECT no_emp,nombres, ap_paterno, ap_materno, horas_impartir, tipo_plaza FROM profesores;
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
    SELECT * from horario_disponible_profesor WHERE no_emp = ${id}`;

    conexion.query(query, (error, resultado) => {
        if(error) return console.error(error.message)
    
        if(resultado.length > 0) {
            res.json(resultado)
        } else {
            res.json(`No hay registros`)
        }
      })
});

//Materias ofertadas, id, grupo
app.get('/materias/ofertadas',(req, res)=>{
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