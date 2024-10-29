async function uploadFile() {
    const fileInput = document.getElementById('uploadFile'); 
    const siteLink = document.getElementById('googleSite');
    const file = fileInput.files[0];
    const myLink = siteLink.value;
    const codigoHTML = document.getElementById('mensaje-copiado');
    const personalizacion = codigoHTML.innerText || codigoHTML.innerHTML;


    if (!file || myLink == '') {
        swal("Error al intentar cargar el archivo", "selecciona el archivo de Excel con Nombre, Pases y Frase y agrega el link de Google Site para procesar la información para las invitaciones.", "error");
        return;
    }

    function isValidUrl(string) {
        try {
          new URL(string);
          return true;
        } catch (err) {
          return false;
        }
      }
      
     if (!isValidUrl(myLink)) 
     {
        swal("Error en la direccion del Link ingresada", "El link de Google Site no tiene el formato correcto. Por favor revisar y volver a ingresar.", "error");
        return;
    }

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
        const response = await fetch('/upload', { method: 'POST', body: formData });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error);
        }

        const data = await response.json();
        const tableBody = document.querySelector('#eventTable tbody');
        tableBody.innerHTML = ''; // Limpiar la tabla

        data.forEach(evento => {
            tableBody.appendChild(crearFila(evento, myLink, personalizacion));
            document.getElementById('btnExport').disabled = false;
        });
    } catch (error) {
        swal("Error al cargar el archivo de Excel de los Eventos", "Por favor, vuelva a intentarlo. Selecciona el archivo de Excel con Nombre, Pases y Frase. Error:" + error.message, "error");
    }
}

function crearFila(evento, myLink, personalizacion) {
    const row = document.createElement('tr');
    const nombre = `${evento.Nombre}`;
    const pases = `${evento.Pases}`;
    const frases = `${evento.Frase}`;
    const URLLink = encodeURI(`https://tufiesta.netlify.app/?${personalizacion}&n=${nombre}&p=${pases}&f=${frases}&l=${myLink}`);

    

    row.innerHTML = `
        <td>${nombre}</td>
        <td>${pases}</td>
        <td>${frases}</td>
        <td><input type="text" value="${myLink}" name="GoogleLink" /></td>
        <td><input type="text" value="${URLLink}" name="InvitationLink" /></td>
        <td><button onclick="copiarContenido(this)" class="btn-copy">Copiar</button></td>
    `;
    return row;

}

function copiarContenido(element) {
    const invitationLink = element.parentElement.parentElement.querySelector('input[name="InvitationLink"]');
    invitationLink.select();
    var text = invitationLink.value;
    navigator.clipboard.writeText(text).then(function() {
        swal("Link Copiado", "El link de invitación fué copiado al portapapeles. Link: " + invitationLink.value, "success");
    }, function(err) {
        swal("Link No Copiado", "No se pudo copiar el link de invitación al portapapeles. Por favor, revise que el campo no esté en blanco y vuelva a intentarlo", "error");
    });
   
}

async function exportList() {
    const rows = document.querySelectorAll('#eventTable tbody tr');
    const data = Array.from(rows).map(row => {
        const nombre = row.children[0].textContent;
        const pases = row.children[1].textContent;
        const frase = row.children[2].textContent;
        const googleLink = row.querySelector('input[name="GoogleLink"]').value;
        const invitationLink = row.querySelector('input[name="InvitationLink"]').value;
        return { Nombre: nombre, Pases: pases, Frase: frase, GoogleLink: googleLink, InvitationLink: invitationLink };
    });

    try {
        const response = await fetch('/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eventos_exportados.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        swal("Exito al Exportar", "Archivo de Excel Exportado. Revise la carpeta de Descargas o Downloads", "success");
    } catch (error) {
        swal("Error al Exportar el Excel", "No se pudo exportar el archivo de excel. Por favor, revise que la lista no esté en blanco y vuelva a intentarlo. Detalle del error: " + error.message, "error");
    }
}

function clearList() {
    document.querySelector('#eventTable tbody').innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay datos disponibles.</td></tr>`;
}
