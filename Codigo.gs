// Función doGet para servir la aplicación web
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Sistema de Registro de Atenciones')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Configuración global
const CONFIG = {
  SPREADSHEET_ID: 'TbKioDxqjfCT3XfUUnN8BCqw_fQ2URl15wBc-1ki7KU',
  HOJAS: {
    USUARIOS: 'Usuarios',
    REGISTROS: 'Registros',
    CONFIG: 'Configuracion'
  }
};

// Función para validar usuario
function validarUsuario(usuario, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaUsuarios = ss.getSheetByName(CONFIG.HOJAS.USUARIOS);
  const datos = hojaUsuarios.getDataRange().getValues();
  
  for (let i = 1; i < datos.length; i++) {
    // Columna C (índice 2) = usuario, Columna D (índice 3) = password, Columna H (índice 7) = estado
    if (datos[i][2] === usuario && datos[i][3] === password && datos[i][7] === 'ACTIVO') {
      return {
        success: true,
        userData: {
          nombre: datos[i][1],    // Columna B (índice 1) = nombre completo
          perfil: datos[i][6],    // Columna G (índice 6) = perfil
          area: datos[i][4],      // Columna E (índice 4) = área
          cargo: datos[i][5]      // Columna F (índice 5) = cargo
        }
      };
    }
  }
  return { success: false, message: 'Usuario o contraseña incorrectos' };
}

// Función para guardar nuevo registro
function guardarRegistro(datos) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaRegistros = ss.getSheetByName(CONFIG.HOJAS.REGISTROS);
  
  const fecha = new Date();
  const fechaFormateada = Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const hora = Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'HH:mm:ss');
  
  const registro = [
    fechaFormateada,
    hora,
    datos.curso,
    datos.nombreEstudiante,
    datos.motivo,
    datos.subMotivo,
    datos.comentario,
    datos.nombreProfesonal,
    datos.area,
    datos.cargo
  ];
  
  hojaRegistros.appendRow(registro);
  return { success: true, message: 'Registro guardado exitosamente' };
}

// Función para obtener registros
function obtenerRegistros(fechaInicio, fechaFin, curso = '', estudiante = '') {
    Logger.log('Parámetros recibidos:');
    Logger.log(`Inicio: ${fechaInicio}, Fin: ${fechaFin}, Curso: ${curso}, Estudiante ${estudiante}`);
    
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const hojaRegistros = ss.getSheetByName(CONFIG.HOJAS.REGISTROS);
    const datos = hojaRegistros.getDataRange().getValues();
    
    const inicioDate = new Date(fechaInicio + 'T00:00:00');
    const finDate = new Date(fechaFin + 'T23:59:59');
    
    let registrosFiltrados = datos.slice(1).filter(row => {
        if (!row[0]) return false;
        
        const fechaReg = new Date(row[0]);
        const cumpleFecha = fechaReg >= inicioDate && fechaReg <= finDate;
        const cumpleCurso = !curso || row[2].toString().toLowerCase() === curso.toLowerCase();
        const cumpleEstudiante = !estudiante || row[3].toString().toLowerCase().includes(estudiante.toLowerCase());
        
        return cumpleFecha && cumpleCurso && cumpleEstudiante;
    });

    return registrosFiltrados.map(row => {
        const fechaFormateada = Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'dd/MM/yyyy');
        const horaFormateada = Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), 'HH:mm:ss');
        return [
            fechaFormateada,
            horaFormateada, 
            row[2] || '',
            row[3] || '',
            row[4] || '',
            row[5] || '',
            row[6] || '',
            row[7] || '',
            row[8] || '',
            row[9] || ''
        ];
    });
}

// Función para gestionar usuarios
function gestionarUsuario(accion, datos) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaUsuarios = ss.getSheetByName(CONFIG.HOJAS.USUARIOS);
  
  switch(accion) {
    case 'crear':
      const nuevoUsuario = [
        new Date(),                // Columna A (índice 0) = fecha
        datos.nombreCompleto,      // Columna B (índice 1) = nombre completo
        datos.usuario,             // Columna C (índice 2) = usuario
        datos.password,            // Columna D (índice 3) = contraseña
        datos.area,                // Columna E (índice 4) = área
        datos.cargo,               // Columna F (índice 5) = cargo
        datos.perfil,              // Columna G (índice 6) = perfil
        'ACTIVO'                   // Columna H (índice 7) = estado
      ];
      hojaUsuarios.appendRow(nuevoUsuario);
      return { success: true, message: 'Usuario creado exitosamente' };
    
    case 'actualizar':
      const datosUsuarios = hojaUsuarios.getDataRange().getValues();
      for (let i = 1; i < datosUsuarios.length; i++) {
        if (datosUsuarios[i][2] === datos.usuario) {  // Columna C (índice 2) = usuario
          hojaUsuarios.getRange(i + 1, 2).setValue(datos.nombreCompleto);  // Columna B
          hojaUsuarios.getRange(i + 1, 4).setValue(datos.password);        // Columna D
          hojaUsuarios.getRange(i + 1, 5).setValue(datos.area);           // Columna E
          hojaUsuarios.getRange(i + 1, 6).setValue(datos.cargo);          // Columna F
          hojaUsuarios.getRange(i + 1, 7).setValue(datos.perfil);         // Columna G
          hojaUsuarios.getRange(i + 1, 8).setValue(datos.estado);         // Columna H
          return { success: true, message: 'Usuario actualizado exitosamente' };
        }
      }
      return { success: false, message: 'Usuario no encontrado' };
    
    case 'eliminar':
      const usuarios = hojaUsuarios.getDataRange().getValues();
      for (let i = 1; i < usuarios.length; i++) {
        if (usuarios[i][2] === datos.usuario) {  // Columna C (índice 2) = usuario
          hojaUsuarios.getRange(i + 1, 8).setValue('INACTIVO');  // Columna H (índice 7) = estado
          return { success: true, message: 'Usuario desactivado exitosamente' };
        }
      }
      return { success: false, message: 'Usuario no encontrado' };
  }
}

// Función para obtener lista de usuarios
function obtenerUsuarios() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaUsuarios = ss.getSheetByName(CONFIG.HOJAS.USUARIOS);
  const datos = hojaUsuarios.getDataRange().getValues();
  
  // Filtrar usuarios que tengan al menos usuario (columna C) y procesar las fechas
  return datos.slice(1).filter(row => row[2]).map(row => {
    // Si la fecha existe, formatearla, si no, dejar vacío
    const fecha = row[0] instanceof Date ? 
      Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss') : '';
    
    return [
      fecha,                // Columna A: fecha formateada
      row[1] || '',        // Columna B: nombre completo
      row[2] || '',        // Columna C: usuario
      row[3] || '',        // Columna D: contraseña
      row[4] || '',        // Columna E: área
      row[5] || '',        // Columna F: cargo
      row[6] || '',        // Columna G: perfil
      row[7] || 'ACTIVO'   // Columna H: estado
    ];
  });
}

// Función para obtener datos de un usuario específico
// Función para obtener datos de un usuario específico
function obtenerDatosUsuario(usuario) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const hojaUsuarios = ss.getSheetByName(CONFIG.HOJAS.USUARIOS);
    const datos = hojaUsuarios.getDataRange().getValues();
    
    for (let i = 1; i < datos.length; i++) {
      if (datos[i][2] === usuario) {  // Columna C (índice 2) = usuario
        // Asegurarse de que la fecha (si existe) esté en formato correcto
        const fecha = datos[i][0] instanceof Date ? 
          Utilities.formatDate(datos[i][0], Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
        
        return [
          fecha,           // Fecha formateada
          datos[i][1],     // Nombre completo
          datos[i][2],     // Usuario
          datos[i][3],     // Password
          datos[i][4],     // Área
          datos[i][5],     // Cargo
          datos[i][6],     // Perfil
          datos[i][7] || 'ACTIVO'  // Estado
        ];
      }
    }
    return null;
  } catch (error) {
    console.error('Error en obtenerDatosUsuario:', error);
    throw new Error('Error al obtener datos del usuario: ' + error.toString());
  }
}

// Función para obtener configuraciones
function obtenerConfiguraciones() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaConfig = ss.getSheetByName(CONFIG.HOJAS.CONFIG);
  const datos = hojaConfig.getDataRange().getValues();
  
  const config = {
    motivos: [],
    subMotivos: {},
    productos: [],
    estudiantesPorProducto: {}
  };
  
  datos.slice(1).forEach((row, index) => {
    if (row[0] && !config.motivos.includes(row[0])) {
      config.motivos.push(row[0]);
    }
    if (row[0] && row[1]) {
      if (!config.subMotivos[row[0]]) {
        config.subMotivos[row[0]] = [];
      }
      config.subMotivos[row[0]].push(row[1]);
    }

    if (row[2]) {
      config.productos.push(row[2]);
      const colIndex = 3 + index;
      if (colIndex <= 10) {
        const estudiantes = datos.slice(1)
          .map(r => r[colIndex])
          .filter(estudiante => estudiante && estudiante.trim() !== '');
        config.estudiantesPorProducto[row[2]] = estudiantes;
      }
    }
  });
  
  return config;
}

