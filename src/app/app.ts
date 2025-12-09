import { Component, signal, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Step {
  number: number;
  title: string;
  description: string;
  detailedInfo?: string;
  requirements?: string[];
  tips?: string[];
  pdfs?: { name: string; url: string }[];
  modalidades?: { name: string; content: string; acordeones?: { titulo: string; contenido: string }[]; pdf?: string }[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class App implements AfterViewInit {
  protected readonly title = signal('instructivo-admisiones');
  protected visible = signal(false);
  protected selectedStep = signal<Step | null>(null);
  protected closing = signal(false);
  protected isBrowser = signal(false);
  protected currentPdfUrl = signal<string | null>(null);
  protected selectedPdfIndex = signal<number>(0);
  protected showSteps = signal<boolean>(true);
  protected visibleTerms = signal(false);
  protected closingTerms = signal(false);
  protected visibleGratuidad = signal(false);
  protected closingGratuidad = signal(false);
  protected selectedModalidadIndex = signal<number>(0);
  protected selectedAcordeonIndex = signal<number | null>(null);
  protected acordeonClosing = signal<number | null>(null);
  protected selectedIconInfo = signal<string | null>(null);
  protected activeIcon = signal<string | null>(null);
  protected closingIconPanel = signal(false);
  protected openingIconPanel = signal(false);
  protected atencionVisible = signal(false);
  
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);
  
  constructor() {
    this.isBrowser.set(isPlatformBrowser(this.platformId));
  }
  
  ngAfterViewInit() {
    if (this.isBrowser()) {
      this.loadPdfJs();
      this.setupScrollObserver();
    }
  }
  
  private setupScrollObserver() {
    if (this.isBrowser()) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Solo cambiar el estado si está claramente dentro o fuera
            if (entry.intersectionRatio > 0.5) {
              this.atencionVisible.set(true);
            } else if (entry.intersectionRatio < 0.2) {
              this.atencionVisible.set(false);
            }
          });
        },
        {
          threshold: [0, 0.2, 0.5, 0.8, 1], // Múltiples umbrales para mejor control
          rootMargin: '0px' // Sin margen adicional
        }
      );

      // Observar el contenedor después de un pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        const container = document.getElementById('atencion-container');
        if (container) {
          observer.observe(container);
        }
      }, 100);
    }
  }
  
  private async loadPdfJs() {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    } catch (error) {
      console.warn('Could not load PDF.js:', error);
    }
  }
  
  selectPdf(index: number, url: string) {
    this.selectedPdfIndex.set(index);
    this.currentPdfUrl.set(url);
  }

  sanitizePdfUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  selectModalidad(index: number) {
    this.selectedModalidadIndex.set(index);
    this.selectedAcordeonIndex.set(null); // Reset acordeón al cambiar modalidad
  }

  toggleAcordeon(index: number) {
    if (this.selectedAcordeonIndex() === index) {
      // Cerrar acordeón con animación
      this.acordeonClosing.set(index);
      setTimeout(() => {
        this.selectedAcordeonIndex.set(null);
        this.acordeonClosing.set(null);
      }, 300);
    } else {
      // Cerrar acordeón anterior si existe
      const previousIndex = this.selectedAcordeonIndex();
      if (previousIndex !== null) {
        this.acordeonClosing.set(previousIndex);
        setTimeout(() => {
          this.selectedAcordeonIndex.set(index);
          this.acordeonClosing.set(null);
        }, 300);
      } else {
        // Abrir nuevo acordeón directamente
        this.selectedAcordeonIndex.set(index);
      }
    }
  }

  onAcordeonMouseEnter(event: Event) {
    const target = event.target as HTMLElement;
    target.classList.add('bg-usco-vino', 'text-white');
    target.classList.remove('bg-usco-ocre', 'text-gray-600');
  }

  onAcordeonMouseLeave(event: Event, index: number) {
    if (this.selectedAcordeonIndex() !== index) {
      const target = event.target as HTMLElement;
      target.classList.add('bg-usco-ocre', 'text-gray-600');
      target.classList.remove('bg-usco-vino', 'text-white');
    }
  }
  
  getGoogleViewerUrl(pdfUrl: string): string {
    if (this.isBrowser()) {
      const fullUrl = `${window.location.origin}/${pdfUrl}`;
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`;
    }
    return pdfUrl;
  }

  async loadPdfInViewer(url: string) {
    if (this.isBrowser()) {
      this.currentPdfUrl.set(url);
      console.log('Cargando PDF:', url);
    }
  }
  
  protected readonly steps: Step[] = [
    {
      number: 1,
      title: '1. OFERTA ACADÉMICA - NUESTROS PROGRAMAS ACADÉMICOS',
      description: 'Consulta la oferta académica por sede',
      pdfs: [
        { name: 'SEDE NEIVA', url: 'documents/OFERTA-ACADEMICA-SEDE-NEIVA.pdf' },
        { name: 'SEDE GARZÓN', url: 'documents/OFERTA-ACADEMICA-SEDE-GARZON.pdf' },
        { name: 'SEDE LA PLATA', url: 'documents/OFERTA-ACADEMICA-SEDE-LA-PLATA.pdf' },
        { name: 'SEDE PITALITO', url: 'documents/OFERTA-ACADEMICA-SEDE-PITALITO.pdf' }
      ]
    },
    {
      number: 2,
      title: '2. MODALIDADES DE INSCRIPCIÓN',
      description: 'Consulta las modalidades de inscripción disponibles',
      modalidades: [
        {
          name: 'Por Estricto Puntaje',
          content: `**MODALIDAD DE INSCRIPCIÓN POR ESTRICTO PUNTAJE**
Participan los aspirantes con el puntaje ponderado establecido en cada Programa Académico con la Prueba de Estado (ICFES o Saber 11).`
        },
        {
          name: 'Por Regímenes Especiales',
          content: `**MODALIDADES DE INSCRIPCIÓN POR REGÍMENES ESPECIALES**
La Universidad otorgará un (1) cupo especial en cada uno de los Programas de Pregrado ofrecidos a aspirantes que provengan de:`,
          acordeones: [
            {
              titulo: '1. Comunidades Negras, Afrocolombianas, Raizales y Palanqueras',
              contenido: `**ENTREGA DE DOCUMENTOS** El aspirante que pertenezca y se inscriba por este régimen especial, debe entregar el documento oficial expedido por el Ministerio del Interior que acredite la condición, el cual debe tener una vigencia de expedición no mayor de tres (3) meses a la fecha de presentación en la Universidad. Adicionalmente, debe adjuntar el respectivo certificado de inscripción. Estos deben entregarse en la oficina de Registro y Control Académico de la sede central de la Universidad Surcolombiana o a través del correo: <a href="mailto:registro@usco.edu.co" class="underline text-blue-600">registro@usco.edu.co</a>

**FECHAS ENTREGA DE DOCUMENTOS** <span class="text-blue-900 font-bold">DEL 15 DE SEPTIEMBRE AL <strike>28 DE OCTUBRE</strike><span class="text-green-600 text-lg"> 5 DE NOVIEMBRE</span> DE 2025 A LAS 6:00 P.M.</span>

**PARA TENER EN CUENTA** El aspirante deberá entregar la documentación completa y en los términos que aquí se detallan. Si el aspirante no presenta la documentación completa en las fechas establecidas, no será tenido en cuenta dentro del proceso de selección y admisión. La Universidad no se hace responsable por los documentos que no se reciban completos y en los plazos establecidos.`
            },
            {
              titulo: '2. Desplazados por la Violencia',
              contenido: `**ENTREGA DE DOCUMENTOS** El aspirante que pertenezca y se inscriba por este régimen especial, deberá entregar el documento oficial expedido por la Unidad para la Atención y Reparación Integral a las Víctimas de la Presidencia de la República que acredite la condición, el cual debe tener una vigencia de expedición no mayor de tres (3) meses a la fecha de presentación en la Universidad. Adicionalmente, deberá adjuntar el respectivo certificado de inscripción. Estos deben entregarse en la oficina de Registro y Control Académico de la sede central de la Universidad Surcolombiana o a través del correo: <a href="mailto:registro@usco.edu.co" class="underline text-blue-600">registro@usco.edu.co</a>

**FECHAS ENTREGA DE DOCUMENTOS** <span class="text-blue-900 font-bold">DEL 15 DE SEPTIEMBRE AL <strike>28 DE OCTUBRE</strike><span class="text-green-600 text-lg"> 5 DE NOVIEMBRE</span> DE 2025 A LAS 6:00 P.M.</span>

**PARA TENER EN CUENTA** El aspirante deberá entregar la documentación completa y en los términos que aquí se detallan. Si el aspirante no presenta la documentación completa en las fechas establecidas para ello, no será tenido en cuenta dentro del proceso de selección y admisión. La Universidad no se hace responsable por los documentos que no se reciban completos y en los plazos establecidos.`
            },
            {
              titulo: '3. Reincorporados y/o Reintegrados en el Marco del Programa por la Paz',
              contenido: `Podrán presentarse como aspirante a esta modalidad aquellas personas beneficiarias del Programa de Reincoporación y/o Reintegración en el Marco del Programa para la Paz (<a href="https://www.usco.edu.co/archivosUsuarios/19/publicacion/consejo_academico/acuerdo/acuerdo_096_de_2019.pdf" target="_blank" class="underline text-blue-600">Acuerdo 096 del 17 de diciembre de 2019</a>).

**ENTREGA DE DOCUMENTOS** El aspirante que pertenezca y se inscriba por este régimen especial, deberá entregar la certificación expedida por la Agencia para la Reincorporación y la Normalización - ARN, con el fin de acreditar su condición. El documento debe tener una vigencia de expedición no mayor a tres (3) meses a la fecha de presentación en la Universidad. Adicionalmente, deberá adjuntar el respectivo certificado de inscripción. Estos deben entregarse en la oficina de Registro y Control Académico de la sede central de la Universidad Surcolombiana o a través del correo: <a href="mailto:registro@usco.edu.co" class="underline text-blue-600">registro@usco.edu.co</a>

**FECHAS ENTREGA DE DOCUMENTOS** <span class="text-blue-900 font-bold">DEL 15 DE SEPTIEMBRE AL <strike>28 DE OCTUBRE</strike><span class="text-green-600 text-lg"> 5 DE NOVIEMBRE</span> DE 2025 A LAS 6:00 P.M.</span>

**PARA TENER EN CUENTA** El aspirante deberá entregar la documentación completa y en los términos que aquí se detallan. Si el aspirante no presenta la documentación completa en las fechas establecidas para ello, no será tenido en cuenta dentro del proceso de selección y admisión. La Universidad no se hace responsable por los documentos que no se reciban completos y en los plazos establecidos.`
            },
            {
              titulo: '4. Comunidades Indígenas',
              contenido: `**Aspirantes de las Comunidades Indígenas** El Cabildo Indígena de la Universidad Surcolombiana desea colaborarles en el proceso de Inscripción, Admisión y Matrícula; por tal motivo, cualquier inquietud al respecto dirigirla al correo electrónico: <a href="mailto:cabildouniversitariousco@hotmail.com" class="underline text-blue-600">cabildouniversitariousco@hotmail.com</a>.

El Consejo Académico en el <a href="https://www.usco.edu.co/archivosUsuarios/21/publicacion/consejo_academico/acuerdo/acuerdo_014_de_2021.pdf" target="_blank" class="underline text-blue-600">Acuerdo CA número 014 del 19 de noviembre de 2021</a> modificó el Artículo 25 Numeral 1 del Acuerdo CA No.003 de 2016, quedando así:

**ENTREGA DE DOCUMENTOS** Podrán presentarse como aspirantes a esta modalidad aquellas personas que demuestren ser integrantes de Comunidades Indígenas, para lo cual deberán acreditar al menos uno de los siguientes documentos:

a). Presentar el documento expedido por el Ministerio del Interior que certifique su registro en el Censo de la comunidad indígena respectiva.
b). O presentar "certificado de pertenencia de la comunidad indígena", con una vigencia no mayor a 3 meses, firmado por la autoridad registrada ante la Dirección de Asuntos Indígenas, ROM y Minorías del Ministerio del Interior para el año en curso, en donde, además, deberá señalarse el correo electrónico de la Comunidad Indígena, el cual debe estar activo y ser un único correo institucional de uso de la Autoridad Tradicional, si lo tuviere.

**FECHAS ENTREGA DE DOCUMENTOS** <span class="text-blue-900 font-bold">DEL 15 DE SEPTIEMBRE AL <strike>28 DE OCTUBRE</strike><span class="text-green-600 text-lg"> 5 DE NOVIEMBRE</span> DE 2025 A LAS 6:00 P.M.</span> deben ser entregados por el aspirante en la oficina de Registro y Control Académico de la sede central de la Universidad Surcolombiana o a través del correo: <a href="mailto:registro@usco.edu.co" class="underline text-blue-600">registro@usco.edu.co</a>, adjuntado el respectivo certificado de inscripción, y el certificado de terminación de estudios de bachillerato en una institución educativa indígena (si es su caso), dentro del periodo de inscripciones de la presente convocatoria.

**FECHA PRESENTACIÓN PRUEBA** <span class="text-blue-900 font-bold"><strike>Miercoles 29 DE OCTUBRE</strike><span class="text-green-600 text-lg"> Jueves 6 de NOVIEMBRE</span> de 2025 a las 8:00 A.M.</span> en el tercer piso de la Biblioteca de la Sede Central ubicada en Neiva. Los aspirantes que se inscriban bajo esta modalidad deberán presentar la prueba oral sobre el manejo del idioma indígena propio y/o prueba sobre realidad y cultura Indígena.

**PARA TENER EN CUENTA** La Universidad podrá verificar la veracidad de la información suministrada con el apoyo del CRIHU, también se apoyará en organizaciones indígenas de reconocida trayectoria y el Ministerio del Interior - Dirección de Asuntos Indígenas o quien haga sus veces.

Es de aclarar que cuando el número de aspirantes del régimen especial de Comunidades Indígenas sea mayor a uno para ingresar a un Programa Académico, será admitido aquel que logre el mayor puntaje, teniendo en cuenta lo dispuesto en el Artículo 1 del <a href="https://www.usco.edu.co/archivosUsuarios/21/publicacion/consejo_academico/acuerdo/acuerdo_014_de_2021.pdf" target="_blank" class="underline text-blue-600">Acuerdo CA número 014 del 19 de noviembre de 2021</a>.

El aspirante deberá entregar la documentación completa y en los términos que se detallan para cada régimen especial. Si el aspirante no presenta la documentación completa requerida en las fechas establecidas para ello, no será tenido en cuenta en el proceso de selección. La Universidad no se hace responsable por los documentos que no se reciban completos y fuera de los plazos establecidos.`
            }
          ]
        },
        {
          name: 'Por Convenio con Escuelas Normales',
          content: `**MODALIDAD DE INSCRIPCIÓN POR CONVENIO CON ESCUELAS NORMALES**En virtud de los convenios firmados entre la Universidad Surcolombiana y las Escuelas Normales de Neiva, Gigante y Pitalito, al amparo del Decreto 3012 de 1997, los egresados de dichas Normales ingresan por esta modalidad a los Programas ofrecidos por la Facultad de Educación, como aspirantes especiales; a quienes ingresen, una vez matriculados se les efectuará el estudio de homologación del "Ciclo Complementario".

**ENTREGA DE DOCUMENTOS** Para el estudio de ingreso a través de Convenio con Escuelas Normales, el aspirante inscrito deberá entregar de manera presencial o enviar al correo electrónico del programa académico al cual se inscribió, (los correos se indican más adelante), los siguientes documentos:

a). Fotocopia del documento de identidad por ambos lados en una sola página.
b). Certificado de inscripción.
c). Certificado en donde conste que cumplió con el ciclo complementario y el reporte de las calificaciones obtenidas.
d). Examen de Estado para ingreso a la educación superior ICFES.

**FECHAS ENTREGA DE DOCUMENTOS** <span class="text-blue-900 font-bold">DEL 15 DE SEPTIEMBRE AL <strike>28 DE OCTUBRE</strike><span class="text-green-600 text-lg"> 5 DE NOVIEMBRE</span> DE 2025 A LAS 6:00 P.M.</span>

**CORREOS ELECTRÓNICOS DE LOS PROGRAMAS DE LA FACULTAD DE EDUCACIÓN**

1. Licenciatura en Lenguas Extranjeras con Énfasis en Inglés: <a href="mailto:lenguaextranjera@usco.edu.co" class="underline text-blue-600">lenguaextranjera@usco.edu.co</a>
2. Licenciatura en Matemáticas: <a href="mailto:licemat@usco.edu.co" class="underline text-blue-600">licemat@usco.edu.co</a>
3. Licenciatura en Ciencias Sociales: <a href="mailto:lic.cienciassociales@usco.edu.co" class="underline text-blue-600">lic.cienciassociales@usco.edu.co</a>
4. Licenciatura en Educación Física, Recreación y Deportes: <a href="mailto:edufisica@usco.edu.co" class="underline text-blue-600">edufisica@usco.edu.co</a>
5. Licenciatura en Literatura y Lengua Castellana: <a href="mailto:lic.castellana@usco.edu.co" class="underline text-blue-600">lic.castellana@usco.edu.co</a>
6. Licenciatura en Ciencias Naturales y Educación Ambiental: <a href="mailto:cienciasnaturales@usco.edu.co" class="underline text-blue-600">cienciasnaturales@usco.edu.co</a>
7. Licenciatura en Educación Infantil: <a href="mailto:pedagogiainfantil@usco.edu.co" class="underline text-blue-600">pedagogiainfantil@usco.edu.co</a>
8. Licenciatura en Educación Artística: <a href="mailto:pedagogiainfantil@usco.edu.co" class="underline text-blue-600">educacionartistica@usco.edu.co</a>
**NOTA** Directamente la Dirección de Registro y Control Académico y la Oficina de Liquidación de Derechos Pecuniarios, recibirán en medio físico, hasta el <span class="text-blue-900 font-bold">15 DE DICIEMBRE DE 2025</span>, el respectivo Acuerdo por parte del Consejo de la Facultad de Educación, relacionado con los Aspirantes Admitidos por la modalidad de convenio con ESCUELAS NORMALES. Los Aspirantes Admitidos se convocarán en el ÚLTIMO LLAMADO, el cual se publicará el <span class="text-blue-900 font-bold">14 DE ENERO DE 2026</span>.`
        },
        {
          name: 'Por Transferencia Académica',
          content: `**MODALIDAD DE INSCRIPCIÓN POR TRANSFERENCIA ACADÉMICA**¿Qué significa Transferencia Académica? es el paso de los estudiantes, bien sea de un Programa con registro vigente del ICFES de otra Universidad, hacia la Universidad Surcolombiana, o entre Programas de esta misma Universidad.

Quien aspire a ingresar por esta modalidad debe inscribirse formalmente seleccionando en el formulario de inscripción la opción de Transferencia Académica. La transferencia se realizará conforme a lo establecido en el Acuerdo del Consejo Superior 019 del 6 de Mayo de 2005, adicionando por el Acuerdo 038 del 20 de Septiembre de 2005.

**ENTREGA DE DOCUMENTOS** Para el estudio de la transferencia el aspirante debe cumplir con los requisitos establecidos y enviar la documentación requerida al correo electrónico del programa académico al cual se inscribió (los correos se indican más adelante). Documentos:

a). Presentar solicitud escrita de transferencia dentro del periodo de inscripciones.
b). Aportar el certificado de inscripción, adjuntando el respectivo documento de identidad.
c). Constancia de haber cursado y aprobado en la Universidad de origen mínimo el tercer semestre o 50 créditos académicos del respectivo Programa.
d). Anexar certificado de calificaciones expedido por la Oficina de Registro y Control Académico de la Universidad de origen, donde conste la denominación y la intensidad horaria de las asignaturas y/o créditos cursados - Programas analíticos de las asignaturas cursadas y certificados de no haber sido sancionado disciplinariamente por faltas graves o gravísimas, proferido por la Universidad de donde proviene el solicitante.
e). No estar desvinculado por más de un (1) año de la Universidad de origen.
f). Tener aprobadas todas las asignaturas hasta el semestre cursado.

**FECHAS ENTREGA DE DOCUMENTOS** <span class="text-blue-900 font-bold">DEL 15 DE SEPTIEMBRE AL <strike>28 DE OCTUBRE</strike><span class="text-green-600 text-lg"> 5 DE NOVIEMBRE</span> DE 2025 A LAS 6:00 P.M.</span>

**Correos electrónicos de los programas académicos que aceptan transferencia académica en el PERIODO 2026-1**

1. Ingeniería Agrícola: <a href="mailto:agricola@usco.edu.co" class="underline text-blue-600">agricola@usco.edu.co</a>
2. Ingeniería Agroindustrial: <a href="mailto:agroindustrial@usco.edu.co" class="underline text-blue-600">agroindustrial@usco.edu.co</a>
3. Ingeniería Civil: <a href="mailto:ing.civil@usco.edu.co" class="underline text-blue-600">ing.civil@usco.edu.co</a>
4. Ingeniería de Petróleos: <a href="mailto:petroleos@usco.edu.co" class="underline text-blue-600">petroleos@usco.edu.co</a>
5. Ingeniería de Software: <a href="mailto:ingenieria.software@usco.edu.co" class="underline text-blue-600">ingenieria.software@usco.edu.co</a>
6. Ingeniería Electrónica: <a href="mailto:electronica@usco.edu.co" class="underline text-blue-600">electronica@usco.edu.co</a>
7. Tecnología en Obras Civiles: <a href="mailto:obrasciviles@usco.edu.co" class="underline text-blue-600">obrasciviles@usco.edu.co</a>
8. Tecnología en Desarrollo del Software: <a href="mailto:tecnosoftware@usco.edu.co" class="underline text-blue-600">tecnosoftware@usco.edu.co</a>

9. Derecho: <a href="mailto:derecho@usco.edu.co" class="underline text-blue-600">derecho@usco.edu.co</a>
10. Ciencia Política: <a href="mailto:cienciapolitica@usco.edu.co" class="underline text-blue-600">cienciapolitica@usco.edu.co</a>

11. Contaduría Pública: <a href="mailto:contaduria@usco.edu.co" class="underline text-blue-600">contaduria@usco.edu.co</a>
12. Administración de Empresas: <a href="mailto:empresas@usco.edu.co" class="underline text-blue-600">empresas@usco.edu.co</a>
13. Economía: <a href="mailto:economia@usco.edu.co" class="underline text-blue-600">economia@usco.edu.co</a>
14. Administración Financiera: <a href="mailto:prografinanciera@usco.edu.co" class="underline text-blue-600">prografinanciera@usco.edu.co</a>
15. Administración Turística y Hotelera: <a href="mailto:admon.turistica@usco.edu.co" class="underline text-blue-600">admon.turistica@usco.edu.co</a>

16. Física: <a href="mailto:programa-fisica@usco.edu.co" class="underline text-blue-600">programa-fisica@usco.edu.co</a>
17. Matemática Aplicada: <a href="mailto:matematica-aplicada@usco.edu.co" class="underline text-blue-600">matematica-aplicada@usco.edu.co</a>
18. Biología Aplicada: <a href="mailto:biologia.aplicada@usco.edu.co" class="underline text-blue-600">biologia.aplicada@usco.edu.co</a>

19. Licenciatura en Lenguas Extranjeras con Énfasis en Inglés: <a href="mailto:lenguaextranjera@usco.edu.co" class="underline text-blue-600">lenguaextranjera@usco.edu.co</a>
20. Licenciatura en Matemáticas: <a href="mailto:licemat@usco.edu.co" class="underline text-blue-600">licemat@usco.edu.co</a>
21. Licenciatura en Ciencias Sociales: <a href="mailto:lic.cienciassociales@usco.edu.co" class="underline text-blue-600">lic.cienciassociales@usco.edu.co</a>
22. Licenciatura en Educación Física, Recreación y Deportes: <a href="mailto:edufisica@usco.edu.co" class="underline text-blue-600">edufisica@usco.edu.co</a>
23. Licenciatura en Literatura y Lengua Castellana: <a href="mailto:lic.castellana@usco.edu.co" class="underline text-blue-600">lic.castellana@usco.edu.co</a>
24. Licenciatura en Ciencias Naturales y Educación Ambiental: <a href="mailto:cienciasnaturales@usco.edu.co" class="underline text-blue-600">cienciasnaturales@usco.edu.co</a>
25. Licenciatura en Educación Infantil: <a href="mailto:pedagogiainfantil@usco.edu.co" class="underline text-blue-600">pedagogiainfantil@usco.edu.co</a>
26. Licenciatura en Educación Artística: <a href="mailto:pedagogiainfantil@usco.edu.co" class="underline text-blue-600">educacionartistica@usco.edu.co</a>

27. Medicina: <a href="mailto:medicina@usco.edu.co" class="underline text-blue-600">medicina@usco.edu.co</a>
28. Enfermería: <a href="mailto:enfermeria@usco.edu.co" class="underline text-blue-600">enfermeria@usco.edu.co</a>

29. Psicología: <a href="mailto:psicologia@usco.edu.co" class="underline text-blue-600">psicologia@usco.edu.co</a>
30. Comunicación Social y Periodismo: <a href="mailto:comunicacionsocial@usco.edu.co" class="underline text-blue-600">comunicacionsocial@usco.edu.co</a>
31. Antropología: <a href="mailto:antropologia@usco.edu.co" class="underline text-blue-600">antropologia@usco.edu.co</a>

**NOTA** Directamente la Dirección de Registro y Control Académico y la Oficina de Liquidación de Derechos Pecuniarios, recibirán en medio físico hasta el <span class="text-blue-900 font-bold">15 DE DICIEMBRE DE 2025</span> el respectivo Acuerdo por parte del Consejo de Facultad, relacionado con los Aspirantes Admitidos por la modalidad de TRANSFERENCIA ACADÉMICA. Los Aspirantes Admitidos se convocarán en el ÚLTIMO LLAMADO, el cual se publicará el <span class="text-blue-900 font-bold">14 DE ENERO DE 2026</span>.`
        }
      ]
    },
    {
      number: 3,
      title: '3. PONDERACIONES DE LA PRUEBA DE ESTADO (ICFES O SABER 11)',
      description: 'Consulta las ponderaciones y puntajes por programa',
      modalidades: [
        { name: 'Ponderaciones por Programa Académico', content: '', pdf: 'documents/PONDERACIONES-PRUEBA-DE-ESTADO.pdf' },
        { name: '3.1 Puntajes de Cierre Programas de Pregrado', content: '', pdf: 'documents/puntajes-de-cierre-2025-1-2025-2.pdf' },
        { name: '3.2 Simulador de Ponderaciones', content: '**Simulador de ponderaciones**\n\n<a href="https://sanagustin.usco.edu.co/simulador_ponderados/#/" target="_blank" class="underline text-blue-600">Realice el ejercicio para conocer su puntaje ponderado, según los resultados de las áreas evaluadas por el ICFES.</a> Recuerde que este ejercicio NO GARANTIZA el ingreso a la Universidad Surcolombiana.' }
      ]
    },
    {
      number: 4,
      title: 'PRUEBAS ESPECÍFICAS',
      description: 'Pruebas adicionales para programas específicos',
      modalidades: [
        {
          name: '4.1 Examen médico y prueba de aptitud física',
          content: `**4.1 Examen médico y prueba de aptitud física para los Aspirantes inscritos al Programa de Licenciatura en Educación Física, Recreación y Deportes**<table class="min-w-full border-collapse border border-usco-gris-lighter mt-4" style="min-width: 800px;"
  <thead>
    <tr class="bg-usco-gris-pale">
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">TIPO DE PRUEBA</th>
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">SEDE</th>
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">FECHA</th>
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">LUGAR</th>
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">HORA</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4" class="border border-usco-gris-lighter p-3 font-usco-bold text-usco-gris-dark text-center align-middle">VALORACIÓN MÉDICA</td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">NEIVA</td>
      <td rowspan="4" class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-center align-middle"><strike>MIÉRCOLES 29 Y JUEVES 30 DE OCTUBRE DE 2025</strike><br><span class="text-blue-900 font-bold text-lg">JUEVES 6 Y VIERNES 7 DE NOVIEMBRE DE 2025</span></td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">Consultorio médico, Bienestar Universitario. Sede central.</td>
      <td rowspan="4" class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-center align-middle">7:00 a.m. a 5:00 p.m. (jornada continua)</td>
    </tr>
    <tr class="bg-usco-gris-pale bg-opacity-30">
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">GARZÓN</td>
      <td rowspan="3" class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-center align-middle">Consultorio médico de cada sede.</td>
    </tr>
    <tr>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">LA PLATA</td>
    </tr>
    <tr class="bg-usco-gris-pale bg-opacity-30">
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">PITALITO</td>
    </tr>
    <tr class="bg-usco-gris-pale bg-opacity-30">
      <td rowspan="4" class="border border-usco-gris-lighter p-3 font-usco-bold text-usco-gris-dark text-center align-middle">PRUEBA DE APTITUD FÍSICA</td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">NEIVA</td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark"><strike>VIERNES 31 DE OCTUBRE DE 2025</strike><br><span class="text-blue-900 font-bold text-lg">LUNES 10 DE NOVIEMBRE DE 2025</span></td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">Coliseo cubierto César Eduardo Medina Perdomo (contiguo a la piscina). Sede central.</td>
      <td rowspan="4" class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-center align-middle">7:00 a.m.</td>
    </tr>
    <tr>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">GARZÓN</td>
      <td rowspan="3" class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-center align-middle"><strike>MARTES 4 DE NOVIEMBRE DE 2025</strike><br><span class="text-blue-900 font-bold text-lg">LUNES 10 DE NOVIEMBRE DE 2025</span></td>
      <td rowspan="3" class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-center align-middle">Polideportivo de la sede.</td>
    </tr>
    <tr class="bg-usco-gris-pale bg-opacity-30">
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">LA PLATA</td>
    </tr>
    <tr>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">PITALITO</td>
    </tr>
  </tbody>
</table>**PARA TENER EN CUENTA**1) Al momento de presentar el examen médico, el aspirante debe presentar el certificado de inscripción y el documento de identificación.
2) Para presentar la prueba de aptitud física, el aspirante debe aportar el certificado de inscripción y el documento de identificación al docente encargado de la misma.
3) El aspirante menor de edad debe igualmente presentar consentimiento informado de los Padres de familia o Acudiente, para realizar la prueba de aptitud física, asumiendo las implicaciones de la misma.
4) Si el médico examinante encuentra alguna anomalía física, se requerirá certificación de aptitud por parte de la E.P.S. para presentar la prueba física. Dicha situación será analizada en el Comité de Admisiones.
5) La prueba de aptitud física es de carácter obligatorio para la selección de los aspirantes en este Programa. Quien no se presente en la fecha, hora y lugar indicado no obtendrá calificación.`
        },
        {
          name: '4.2 Prueba oral idioma y cultura indígena',
          content: `**4.2 Prueba oral de manejo del idioma propio y/o prueba sobre la realidad y cultura indígena para los Aspirantes inscritos por Comunidades Indígenas**

Los aspirantes de las COMUNIDADES INDÍGENAS que se inscriban bajo esta modalidad y cuya inscripción sea válida, deberán presentar la prueba oral sobre el manejo del idioma indígena propio y/o prueba sobre realidad y cultura Indígena.

<table class="min-w-full border-collapse border border-usco-gris-lighter mt-4 mb-4" style="min-width: 800px;"
  <thead>
    <tr class="bg-usco-gris-pale">
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">FECHA</th>
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">LUGAR</th>
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">HORA</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark"><strike>MIÉRCOLES 29 DE OCTUBRE DE 2025</strike><br><span class="text-blue-900 font-bold text-lg">JUEVES 6 DE NOVIEMBRE DE 2025</span></td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">Tercer piso de la Biblioteca de la Sede Central ubicada en Neiva</td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">8:00 a.m.</td>
    </tr>
  </tbody>
</table><a href="https://www.usco.edu.co/archivosUsuarios/21/publicacion/consejo_academico/acuerdo/acuerdo_014_de_2021.pdf" target="_blank" class="underline text-blue-600">Ver Acuerdo CA número 014 del 19 de noviembre de 2021</a>.
Ver numeral 2. MODALIDADES DE INSCRIPCIÓN, Régimen Especial: Comunidades Indígenas, del presente instructivo.`
        },
        {
          name: '4.3 Prueba de Aptitud para Educación Artística',
          content: `**4.3 Prueba de Aptitud para los Aspirantes inscritos al Programa de Licenciatura en Educación Artística**

Los aspirantes al Programa de Licenciatura en Educación Artística deberán presentar una prueba de aptitud específica para demostrar sus habilidades y competencias artísticas.

<table class="min-w-full border-collapse border border-usco-gris-lighter mt-4 mb-4" style="min-width: 800px;"
  <thead>
    <tr class="bg-usco-gris-pale">
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">FECHA</th>
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">LUGAR</th>
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">HORA</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark"><strike>MIÉRCOLES 29 DE OCTUBRE DE 2025</strike><br><span class="text-blue-900 font-bold text-lg">JUEVES 6 DE NOVIEMBRE DE 2025</span></td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">Edificio de Artes ubicado sobre la Carrera 1ra</td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark">2:00 p.m.</td>
    </tr>
  </tbody>
</table>**PARA TENER EN CUENTA**1) Se advierte que ningún aspirante puede presentar la prueba específica, si no se encuentra inscrito en el sistema. El certificado de inscripción y el documento de identidad, serán solicitados al momento de realizar la prueba.
2) La prueba de aptitud artística es de carácter obligatorio para la selección de los aspirantes en este Programa. Quien no se presente a realizar la prueba en los días indicados, no obtendrá calificación.`
        }
      ]
    },
    {
      number: 5,
      title: 'Inscripción y Matrícula',
      description: 'Proceso completo de inscripción y matrícula',
      detailedInfo: 'Proceso completo de inscripción y matrícula con iconos interactivos'
    }
  ];

  showDialog(step: Step) {
    this.selectedStep.set(step);
    this.closing.set(false);
    this.visible.set(true);
    this.selectedPdfIndex.set(0);
    this.selectedModalidadIndex.set(0);
    
    // Prevenir scroll en el fondo
    if (this.isBrowser()) {
      document.body.style.overflow = 'hidden';
    }
    
    // Para el paso 1 y 3, cargar automáticamente el primer PDF
    if ((step.number === 1 || step.number === 3) && step.pdfs && step.pdfs.length > 0) {
      this.selectPdf(0, step.pdfs[0].url);
    }
  }

  hideDialog() {
    this.closing.set(true);
    setTimeout(() => {
      this.visible.set(false);
      this.selectedStep.set(null);
      this.closing.set(false);
      
      // Restaurar scroll en el fondo
      if (this.isBrowser()) {
        document.body.style.overflow = 'auto';
      }
    }, 300);
  }

  toggleSteps() {
    if (!this.showSteps()) {
      this.showSteps.set(true);
    }
  }

  showTermsDialog() {
    this.closingTerms.set(false);
    this.visibleTerms.set(true);
    
    // Prevenir scroll en el fondo
    if (this.isBrowser()) {
      document.body.style.overflow = 'hidden';
    }
  }

  hideTermsDialog() {
    this.closingTerms.set(true);
    setTimeout(() => {
      this.visibleTerms.set(false);
      this.closingTerms.set(false);
      
      // Restaurar scroll en el fondo
      if (this.isBrowser()) {
        document.body.style.overflow = 'auto';
      }
    }, 300);
  }

  showGratuidadDialog() {
    this.closingGratuidad.set(false);
    this.visibleGratuidad.set(true);
    
    // Prevenir scroll en el fondo
    if (this.isBrowser()) {
      document.body.style.overflow = 'hidden';
    }
  }

  hideGratuidadDialog() {
    this.closingGratuidad.set(true);
    setTimeout(() => {
      this.visibleGratuidad.set(false);
      this.closingGratuidad.set(false);
      
      // Restaurar scroll en el fondo
      if (this.isBrowser()) {
        document.body.style.overflow = 'auto';
      }
    }, 300);
  }

  protected formatText(text: string | undefined): string {
    if (!text) return '';
    
    // Si contiene tabla HTML, procesarla de forma especial
    if (text.includes('<table')) {
      // Separar la tabla del resto del contenido
      const parts = text.split('<table');
      if (parts.length === 2) {
        const beforeTable = parts[0];
        const tableAndAfter = '<table' + parts[1];
        const tableEndIndex = tableAndAfter.indexOf('</table>') + '</table>'.length;
        const tableHtml = tableAndAfter.substring(0, tableEndIndex);
        const afterTable = tableAndAfter.substring(tableEndIndex);
        
        const processedBefore = beforeTable
          .replace(/\*\*(.*?)\*\*/g, '<h5 class="font-usco-bold text-usco-vino text-lg mb-2 mt-4">$1</h5>')
          .trim();
        
        const processedAfter = afterTable
          .replace(/\*\*(.*?)\*\*/g, '<h5 class="font-usco-bold text-usco-vino text-lg mb-2 mt-4">$1</h5>')
          .replace(/\n\n/g, '<br><br>')
          .replace(/\n/g, '<br>')
          .trim();
        
        return processedBefore + tableHtml + processedAfter;
      }
      
      return text.replace(/\*\*(.*?)\*\*/g, '<h5 class="font-usco-bold text-usco-vino text-lg mb-2 mt-4">$1</h5>');
    }
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<h5 class="font-usco-bold text-usco-vino text-lg mb-2 mt-4">$1</h5>')
      .replace(/•\s(.*?)(?=\n|$)/g, '<li class="ml-4">• $1</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p class="mb-3">')
      .replace(/$/, '</p>')
      .replace(/<\/p><p class="mb-3"><li/g, '</p><ul class="space-y-1 mb-3"><li')
      .replace(/<\/li><\/p>/g, '</li></ul>')
      .replace(/<\/li><p class="mb-3"><li/g, '</li><li');
  }

  showIconInfo(iconType: string) {
    // Si el icono ya está activo, cerrarlo con animación
    if (this.activeIcon() === iconType) {
      this.closingIconPanel.set(true);
      setTimeout(() => {
        this.selectedIconInfo.set(null);
        this.activeIcon.set(null);
        this.closingIconPanel.set(false);
      }, 300); // Duración de la animación
      return;
    }

    // Si hay otro panel abierto, cerrarlo primero con animación y luego abrir el nuevo
    if (this.activeIcon() !== null && this.activeIcon() !== iconType) {
      this.closingIconPanel.set(true);
      setTimeout(() => {
        this.closingIconPanel.set(false);
        this.setNewIconInfo(iconType);
      }, 300); // Duración de la animación de cierre
      return;
    }

    // Si no hay panel abierto, abrir directamente
    this.setNewIconInfo(iconType);
  }

  private setNewIconInfo(iconType: string) {
    const iconInfoMap: { [key: string]: string } = {
      'pin': `
        <h3 class="text-xl font-usco-condensed-bold mb-4 text-usco-vino">5.1 Compre el Pin</h3>
        <div class="space-y-4 text-usco-gris-dark font-usco">
          <p>Aspirante, es importante que tenga en cuenta la fecha, valor y link para el pago del Derecho de Inscripción (PIN).</p>
          
          <div class="bg-usco-vino-pale p-4 rounded-lg border-l-4 border-usco-vino">
            <h4 class="font-usco-bold text-usco-vino mb-2">FECHAS DE PAGO DEL PIN</h4>
            <p class="font-usco-bold text-blue-900 font-bold">Desde el 15 DE SEPTIEMBRE AL <strike>23</strike><span class="text-green-600 text-2xl"> JUEVES 30</span> DE OCTUBRE DE 2025 hasta las 4:00 p.m.</p>
          </div>


          <div class="bg-usco-ocre-pale p-4 rounded-lg border-l-4 border-usco-ocre-dark">
            <h4 class="font-usco-bold text-usco-vino mb-2">VALOR DE LA INSCRIPCIÓN (PIN)</h4>
            <p><strong>$142.350</strong> el primer PIN. El segundo PIN en adelante, para el mismo aspirante, será habilitado por el 50% del valor, es decir <strong>$71.175</strong>. Para esto, deberá pagar el primer PIN y diligenciar el formulario de inscripción, posteriormente podrá descargar el segundo PIN por el 50% del valor. Un PIN para un formulario de inscripción. No hay límite de PINES por aspirante. <em>Acuerdo No. 013 de 2024 del CSU.</em></p>
          </div>
                    <div class="text-center mb-4">
            <a href="https://gaitana.usco.edu.co/generar_facturas/solicitud_liqui.php?parametro=1" 
               target="_blank" 
               class="inline-block bg-usco-vino hover:bg-usco-vino-dark text-white px-6 py-3 rounded-lg transition-colors duration-200 font-usco-bold text-sm shadow-lg hover:shadow-xl">
              GENERAR COMPROBANTE DE PAGO DE INSCRIPCIÓN
            </a>
          </div>
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <h4 class="font-usco-bold text-red-700 mb-2">IMPORTANTE</h4>
            <p >ASPIRANTE, la inscripción se formaliza con el diligenciamiento del formulario de inscripción. PAGAR SOLO EL PIN, NO LO ACREDITA COMO INSCRITO.</p>
            <p >Pasada la fecha y hora indicada no se permite realizar nuevos registros. <strong>NO DEJE PARA ÚLTIMA HORA EL DILIGENCIAMIENTO DEL FORMULARIO DE INSCRIPCIÓN.</strong></p>
          </div>
          <div class="bg-usco-gris-pale p-4 rounded-lg">
            <h4 class="font-usco-bold text-usco-vino mb-3">PARA TENER EN CUENTA</h4>
            <ul class="space-y-2 text-sm">
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Realice el pago del PIN, para el derecho a la inscripción, únicamente en las entidades financieras estipuladas en el comprobante de pago.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>El PIN se habilitará 24 horas después de efectuado el pago en el banco.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Los pagos del valor de la inscripción (PIN) en el Banco de Occidente, quedan habilitados de manera inmediata. Igualmente podrá realizar los pagos en línea, en el siguiente link comprobante vía web.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Únicamente cuando la Universidad Surcolombiana determine no dar apertura a un Programa Académico, el Aspirante tendrá derecho a la devolución del valor de la Inscripción, para lo cual debe entregar la Certificación Bancaria de cuenta activa con vigencia no mayor a 30 días en la Oficina de Liquidación de Derechos Pecuniarios.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Es importante precisar, que los datos del aspirante tanto para la compra, como para el formulario de inscripción en la plataforma, debe realizarlo, con los datos completos que registra el documento de identidad del aspirante.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Tenga en cuenta que el PIN o PINES que adquiera y no diligencie el formulario de inscripción en la plataforma, no es sujeto a devolución.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>La Universidad Surcolombiana no responde por la legitimidad del comprobante de pago (PIN) y de recaudos realizados en bancos diferentes a los estipulados en dicho comprobante.</span>
              </li>
            </ul>
          </div>
        </div>
      `,
      'formulario': `
        <h3 class="text-xl font-usco-condensed-bold mb-4 text-usco-vino">5.2 Diligencie el Formulario de Inscripción</h3>
        <div class="space-y-4 text-usco-gris-dark font-usco">
          
          <div class="bg-usco-vino-pale p-4 rounded-lg border-l-4 border-usco-vino">
            <h4 class="font-usco-bold text-usco-vino mb-2">FECHAS DE INSCRIPCIÓN</h4>
            <p class="font-usco-bold text-blue-900 font-bold">DEL 15 DE SEPTIEMBRE AL <strike>28 DE OCTUBRE</strike> <span class="text-green-600 text-2xl"> MIERCOLES 5 DE NOVIEMBRE</span> DE 2025 A LAS 4:00 P.M.</p>
          </div>

          <p>Una vez realizado el pago del PIN, deberá continuar con la inscripción diligenciando el formulario con el nombre(s) y apellido(s) registrado en el documento de identificación del ASPIRANTE que pagó el PIN. Es necesario tener al alcance de su mano la información para el diligenciamiento del formulario, según los siguientes documentos:</p>

          <div class="bg-usco-ocre-pale p-4 rounded-lg border-l-4 border-usco-ocre-dark">
            <h4 class="font-usco-bold text-usco-vino mb-3">INFORMACIÓN PARA DILIGENCIAR EL FORMULARIO DE INSCRIPCIÓN</h4>
            <p class="text-sm mb-3 italic">(En caso de ser admitido deberá adjuntar estos mismos documentos en el paso 5.6 de este instructivo)</p>
            <ul class="space-y-2 text-sm">
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Documento de identidad del aspirante, padres o de quien depende económicamente.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Pruebas de Estado (ICFES o Saber 11), para que digite el registro SNP. Recuerde que sólo se aceptan las pruebas de Estado (ICFES o Saber 11) con 10 años de vigencia, es decir, a partir del año 2016.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Certificado donde conste el valor de la pensión del grado 11 del aspirante. El Diploma o Acta de Grado de Bachiller si es egresado de una Institución educativa oficial o pública.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <div>
                  <span class="font-usco-bold">Ingresos mensuales de quien depende económicamente el aspirante:</span> Deberá presentar uno de los siguientes documentos según corresponda:
                  <ul class="mt-2 ml-4 space-y-1">
                    <li>a). Declaración de Renta año 2024.</li>
                    <li>b). Certificado de Ingresos y Retenciones del año 2024 de los Padres.</li>
                    <li>c). Formulario Guía de NO Declarante, del año gravable 2024</li>
                  </ul>
                </div>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Recibo de energía (dirección de quien depende económicamente y estrato socio económico).</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Certificado de Afiliación a la EPS en lo que respecta a condición de cotizante o beneficiario.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Copia de la ficha de clasificación del SISBEN IV.</span>
              </li>
            </ul>
          </div>

          <div class="bg-usco-gris-pale p-4 rounded-lg">
            <h4 class="font-usco-bold text-usco-vino mb-3">PARA TENER EN CUENTA</h4>
            <ul class="space-y-2 text-sm">
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>No olvide revisar el número del SNP ICFES que usted digita en el formulario de inscripción. La Universidad verificará con el Servicio Nacional de Pruebas (SNP) que el número del registro y el nombre de la persona correspondan con los datos suministrados; si no existe concordancia de estos con los datos suministrados por el aspirante, la inscripción será anulada.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>El formulario de Inscripción, debe diligenciarlo con el nombre completo del Aspirante -apellido(s) y nombre(s)- tal como aparece en el documento de identificación y en el PIN.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Usted tiene la opción de cambiar el Programa Académico que eligió al realizar el pago del PIN. Recuerde que el sistema no le permitirá cambiar el nombre, apellido y documento de identidad con el que adquirió el PIN.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Si se inscribió por una modalidad de régimen especial, deberá entregar el (los) documento(s) que acredita la condición, especificado en el paso 2 de este instructivo.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>La prueba de ensayo practicada por el ICFES no es válida para el ingreso a la Educación Superior.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Es importante que sea preciso(a) al diligenciar el formulario de inscripción. De no diligenciar todas las partes, el sistema NO lo registra como inscrito. Revise bien antes de grabar la información.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Una vez grabe la información del formulario de inscripción, el sistema no permite correcciones o modificaciones.</span>
              </li>
            </ul>
          </div>
                              <div class="text-center mb-4">
            <a 
               class="inline-block bg-usco-vino hover:bg-usco-vino-dark text-white px-6 py-3 rounded-lg transition-colors duration-200 font-usco-bold text-4xl shadow-lg hover:shadow-xl">
              PROCESO DE INSCRIPCIÓN CERRADO
            </a>
          </div>
          </div>
        </div>
      `,
      'estado': `
        <h3 class="text-xl font-usco-condensed-bold mb-4 text-usco-vino">5.3 Verifique el Estado de la Inscripción</h3>
        <div class="space-y-4 text-usco-gris-dark font-usco">
          <p>Verifique el estado de su inscripción. Al terminar el diligenciamiento del formulario, verifique la información registrada y grabe su inscripción. El sistema indicará <strong>"INSCRIPCIÓN EN PROCESO"</strong>. Cuando la Universidad verifique el registro del ICFES SNP indicará el estado correspondiente: <strong>"INSCRIPCIÓN VÁLIDA"</strong>, <strong>"INSCRIPCIÓN ANULADA"</strong> o <strong>"SNP NO ENCONTRADO"</strong>.</p>
          
          <div class="bg-usco-gris-pale p-4 rounded-lg">
            <h4 class="font-usco-bold text-usco-vino mb-2">Estados posibles de su inscripción</h4>
            <ul class="space-y-2">
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <div>
                  <span><strong>INSCRIPCIÓN EN PROCESO:</strong></span>
                  <span class="text-sm ml-2">Se muestra inmediatamente después de completar el formulario</span>
                </div>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <div>
                  <span><strong>INSCRIPCIÓN VÁLIDA:</strong></span>
                  <span class="text-sm ml-2">Su inscripción ha sido verificada y aprobada</span>
                </div>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <div>
                  <span><strong>INSCRIPCIÓN ANULADA:</strong></span>
                  <span class="text-sm ml-2">Problemas con la verificación de datos</span>
                </div>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <div>
                  <span><strong>SNP NO ENCONTRADO:</strong></span>
                  <span class="text-sm ml-2">El número de registro ICFES no fue encontrado</span>
                </div>
              </li>
            </ul>
          </div>

          <div class="text-center">
            <a href="https://gaitana.usco.edu.co/inscripciones_pregrado/listado-inscritos" target="_blank" class="inline-block bg-usco-vino hover:bg-usco-vino-dark text-white px-6 py-3 rounded-lg transition-colors duration-200 font-usco-bold text-sm shadow-lg hover:shadow-xl">
              VERIFICAR ESTADO DE INSCRIPCIÓN Y CERTIFICADO
            </a>
          </div>
        </div>
      `,
      'admitidos': `
        <h3 class="text-xl font-usco-condensed-bold mb-4 text-usco-vino">5.4 Consulte las Fechas de Admitidos</h3>
        <div class="space-y-4 text-usco-gris-dark font-usco">
          <p>La Universidad publicará el listado de los admitidos exclusivamente en este instructivo.</p>
          <div class="bg-usco-gris-pale p-4 rounded-lg">
            <h4 class="font-usco-bold text-usco-vino mb-3">FECHAS DE PUBLICACIÓN DE ADMITIDOS</h4>
            <ul class="space-y-3">
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <div>
                  <span class="font-usco-bold text-usco-vino">Publicación aspirantes admitidos en PRIMER LLAMADO:</span>
                  <span class="font-usco-bold text-lg text-blue-900"><strike>MIERCOLES 12</strike><span class="text-green-600 text-2xl"> MARTES 18</span> DE NOVIEMBRE DE 2025</span>
                </div>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <div>
                  <span class="font-usco-bold text-usco-vino">Publicación aspirantes admitidos en SEGUNDO LLAMADO:</span>
                  <span class="font-usco-bold text-lg text-blue-900"><strike>MARTES 9</strike><span class="text-green-600 text-2xl"> VIERNES 12</span> DE DICIEMBRE DE 2025</span>
                </div>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <div>
                  <span class="font-usco-bold text-usco-vino">Publicación aspirantes admitidos en ÚLTIMO LLAMADO:</span>
                  <span class="font-usco-bold text-lg text-blue-900">MIERCOLES 14 DE ENERO DE 2026</span></span>
                </div>
              </li>
            </ul>
          </div>

          <div class="bg-usco-vino-pale p-4 rounded-lg border-l-4 border-usco-vino">
            <h4 class="font-usco-bold text-usco-vino mb-2">INFORMACIÓN DEL ÚLTIMO LLAMADO</h4>
            <p class="text-sm">Surtida la matrícula del segundo llamado, el Comité de Admisiones distribuirá los cupos faltantes en cada uno de los Programas Académicos, teniendo en cuenta:</p>
            <ul class="mt-2 space-y-1 text-sm">
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 flex-shrink-0">1.</span>
                <span>La revisión, estudio y aprobación de solicitudes presentadas por escrito, respetando el puntaje ponderado ICFES</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 flex-shrink-0">2.</span>
                <span>Si es el caso, adjudicará nuevos cupos a los inscritos que siguen en estricto orden de puntaje ponderado</span>
              </li>
            </ul>
          </div>

          <div class="text-center">
            <a href="https://gaitana.usco.edu.co/inscripciones_pregrado/admitidos" target="_blank" class="inline-block bg-usco-vino hover:bg-usco-vino-dark text-white px-6 py-3 rounded-lg transition-colors duration-200 font-usco-bold text-sm shadow-lg hover:shadow-xl">
              VER LISTADO DE ADMITIDOS
            </a>
          </div>
        </div>
      `,
      'financiera': `
        <h3 class="text-xl font-usco-condensed-bold mb-4 text-usco-vino">5.5 Diligencie el Formulario de Admitidos: Matrícula Financiera</h3>
        <div class="space-y-4 text-usco-gris-dark font-usco">
          
          <div class="flex justify-center my-6">
            <a href="https://gaitana.usco.edu.co/admitidos/inicio-sesion" target="_blank" class="bg-usco-vino hover:bg-usco-vino-dark text-white font-usco-bold text-2xl px-16 py-6 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              DILIGENCIE AQUÍ
            </a>
          </div>
          
          <p>Documentación requerida para la liquidación de Matrícula, cronograma y fechas de pago.</p>
          
          <div class="bg-usco-vino-pale p-4 rounded-lg border-l-4 border-usco-vino">
            <h4 class="font-usco-bold text-usco-vino mb-2">CARGUE DE DOCUMENTOS</h4>
            <p class="text-sm">El aspirante admitido(a) debe cargar de manera completa, dentro de los plazos establecidos en la presente convocatoria, la documentación exigida para la Etapa 1. Matrícula Financiera en el ENLACE con el número del PIN que se encuentra en el Comprobante de Pago de la Inscripción:</p>
          </div>

          <div class="bg-usco-ocre-pale p-4 rounded-lg border-l-4 border-usco-ocre-dark">
            <h4 class="font-usco-bold text-usco-vino mb-3">DOCUMENTOS REQUERIDOS</h4>
            <ul class="space-y-2 text-sm">
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Documento de Identidad.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Prueba de Estado (ICFES o Saber 11), donde se evidencie los datos personales y los puntajes obtenidos en cada área de conocimiento.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <div>
                  <span class="font-usco-bold">Ingresos de quien(es) depende económicamente el aspirante admitido(a)</span> (uno de los tres documentos, identificados con a, b, c.):
                  <ul class="mt-2 ml-4 space-y-1 text-xs">
                    <li><strong>a)</strong> Copia de la Declaración de Renta y Patrimonio del año gravable 2024, si es contribuyente, debidamente firmada y con la relación de personas a cargo.</li>
                    <li><strong>b)</strong> Certificado de Ingresos y Retenciones por Rentas de trabajo y de pensiones del año 2024. Debe estar debidamente firmado por el trabajador, con la relación de las personas a su cargo. Aplica a contribuyentes exentos de la obligación de presentar Declaración de Renta, con empleo formal, expedido por el empleador - Formulario 220 – DIAN.</li>
                    <li><strong>c)</strong> Formato Guía Para No Declarante. Corresponde al Certificado de los INGRESOS ANUALES, del año 2024. Aplica para trabajadores independientes, empleo informal, no obligados a declarar renta; debe estar firmado y contener la relación de las personas a cargo.<br> <a href="documents/certificado-de-no-declarante-2026-1.pdf" target="_blank" class="underline text-blue-600">Ver formato</a></li>
                  </ul>
                </div>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Acta de Grado o Diploma de Bachiller (Grado Once).</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Certificado del valor de la pensión mensual, del Grado Once (11), del aspirante admitido(a), que terminó en un colegio de carácter privado.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Recibo de energía eléctrica (todas las caras); en su defecto, el certificado de estratificación del inmueble, expedido por la Oficina de Planeación Municipal (debe coincidir con la dirección del domicilio registrado en el Formulario de Inscripción).</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Certificado de afiliación a la EPS, FOSYGA, ADRES. Debe indicar el estado de afiliación "ACTIVO", con fecha de expedición no mayor a 30 días.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Autorización para el Tratamiento de Datos Personales - aspirantes y estudiantes menores de edad. <a href="documents/AUTORIZACION-TRATAMIENTO-DATOS-PERSONALES.pdf" target="_blank" class="underline text-blue-600">Ver formato</a></span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Certificado de Defunción (si alguno de los padres del aspirante admitido es fallecido).</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span><strong>Documentos opcionales para aplicar a la Política de Gratuidad:</strong> Certificado de SISBÉN si el aspirante admitido(a) pertenece a estrato 4, 5 o 6.</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 class="font-usco-bold text-usco-vino mb-3">PARA TENER EN CUENTA</h4>
            <ul class="space-y-2 text-sm">
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Finalizado el proceso de cargue de los documentos de la Etapa Financiera, el Grupo de Liquidación de Derechos Pecuniarios lleva a cabo la verificación y validación de los documentos. El aspirante admitido(a) deberá estar consultando con el PIN, en el enlace donde los subió, el estado de aceptación o rechazo de los documentos obligatorios para la matrícula financiera durante el proceso de admisión.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Cuando se origine el rechazo de uno o más documentos, por no corresponder, el admitido tiene la posibilidad de subsanar la deficiencia, a mas tardar el día siguiente a la notificación realizada vía correo electrónico, registrado en la inscripción.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Los documentos que no se carguen completa y correctamente, en el link dispuesto, conforme la descripción del presente Instructivo, será entendido como NO CUMPLIDO, y no podrá continuar con el proceso.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>La Universidad se reserva el derecho de verificar la veracidad de los documentos aportados, y de considerarlo necesario, podrá solicitar documentación adicional, para aclarar la situación socio-económica, y/o consultar instancias pertinentes.</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 class="font-usco-bold text-usco-vino mb-2">OPORTUNIDADES PARA SUBSANAR</h4>
            <p class="text-usco-gris-dark text-sm mb-2">En caso de detectar errores u omisiones en la documentación presentada tendrá máximo dos (2) oportunidades para subsanarlos.</p>
            <ul class="space-y-1 text-sm text-usco-gris-dark">
              <li><strong>Primera oportunidad:</strong> Se notificará a través del correo electrónico registrado en el formulario de inscripción y de la plataforma en línea, sobre los errores detectados y el plazo para subsanarlos.</li>
              <li><strong>Última oportunidad:</strong> En caso de que persistan errores o se detecten nuevas omisiones, se notificará nuevamente sobre los errores y el plazo para subsanarlos definitivamente.</li>
            </ul>
            <p class="text-usco-vino text-sm mt-2 font-bold">Nota: El incumplimiento de las dos (2) oportunidades para subsanar resultará en la exclusión del proceso.</p>
          </div>

          <div class="bg-usco-gris-pale border-l-4 border-usco-gris-lighter p-4 rounded-lg">
            <h4 class="font-usco-bold text-usco-vino mb-2">IMPORTANTE</h4>
            <ul class="space-y-2 text-sm text-usco-gris-dark">
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>La Universidad da por concluida la ETAPA 1. MATRÍCULA FINANCIERA, cuando el Grupo de Liquidación de Derechos Pecuniarios realice la validación o rechazo de la totalidad de los documentos exigidos como obligatorios.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Se acepta como cumplida la entrega de la totalidad de la documentación exigida, a través del cargue en el link dispuesto, por lo cual, no es válido el envío por correo electrónico ni la entrega en físico.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>No habrá lugar a devolución del dinero pagado por concepto de matrícula financiera, para aquellos aspirantes que realicen la Matrícula Académica y cancelen el período académico, en cualquier momento, posterior al proceso de admisiones, de conformidad con la Resolución 052B de 2020, Artículo 2 numeral 2.2 literal D y parágrafo 1.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 text-lg flex-shrink-0">•</span>
                <span>Quienes no se encuentren a paz y salvo con la Universidad por todo concepto, no podrán matricularse a un nuevo período académico. (art. 11 del Acuerdo 050 de 2015).</span>
              </li>
            </ul>
          </div>

          <div class="bg-usco-vino-pale p-4 rounded-lg border-l-4 border-usco-vino">
            <h4 class="font-usco-bold text-usco-vino mb-3">CRONOGRAMA Y FECHAS DE PAGO</h4>
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-usco-gris-lighter bg-white">
                <thead>
                  <tr class="bg-usco-vino text-white">
                    <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-sm">ADMITIDOS</th>
                    <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-sm">FECHA PARA CARGAR DOCUMENTOS<br>(Etapa 1. MATRÍCULA FINANCIERA)</th>
                    <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-sm">SUBSANACIÓN DE LA DOCUMENTACIÓN</th>
                    <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-sm">FECHA PUBLICACIÓN DE LA LIQUIDACIÓN</th>
                    <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-sm">FECHA PAGO DE LA LIQUIDACIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="hover:bg-usco-gris-pale">
                    <td class="border border-usco-gris-lighter p-3 font-usco-bold text-usco-vino">PRIMER LLAMADO</td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strike>DEL 13 AL 17</strike><span class="text-green-600 font-bold text-xl"><br> DEL 18 AL 23</span> <span class="font-bold text-lg">DE NOVIEMBRE DE 2025</span></td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strike>DEL 22 AL 25 </strike><span class="text-green-600 font-bold text-xl"><br> DEL 27 AL 29</span> <span class="font-bold text-lg">DE NOVIEMBRE DE 2025</span></td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strike>28 DE NOVIEMBRE DE 2025</strike><span class="text-green-600 font-bold text-xl"><br> 3 DE DICIEMBRE DE 2025</span></td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strike>DEL 29 DE NOVIEMBRE AL 2 DE DICIEMBRE DE 2025</strike><span class="text-green-600 font-bold text-xl"><br> DEL 3 AL 8 DE DICIEMBRE DE 2O25</span></td>

                  </tr>
                  <tr class="bg-usco-gris-pale bg-opacity-50 hover:bg-usco-gris-pale">
                    <td class="border border-usco-gris-lighter p-3 font-usco-bold text-usco-vino">SEGUNDO LLAMADO</td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strike>DEL 9 AL 11</strike><span class="text-blue-600 font-bold text-xl"><br> DEL 12 AL 14</span> <span class="font-bold text-lg">DE DICIEMBRE DE 2025</span></td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strong>17 Y 18 DE DICIEMBRE DE 2025</strong></td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strong>23 DE DICIEMBRE DE 2025</strong></td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strong>DEL 23 AL 28 DE DICIEMBRE DE 2025</strong></td>
                  </tr>
                  <tr class="hover:bg-usco-gris-pale">
                    <td class="border border-usco-gris-lighter p-3 font-usco-bold text-usco-vino">ÚLTIMO LLAMADO</td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strong>DEL 16 AL 18 DE ENERO DE 2026</strong></td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strong>DEL 20 AL 22 DE ENERO DE 2026</strong></td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strong>27 DE ENERO DE 2026</strong></td>
                    <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark text-sm"><strong>27 Y 28 DE ENERO DE 2026</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="text-center">
            <p class="mb-4 text-sm font-usco-bold">Una vez validados y aceptados los documentos, el admitido(a) deberá descargar el comprobante de pago de matrícula en este link y realizar el pago en las fechas que aquí se establecen.</p>
            <a href="https://gaitana.usco.edu.co/generar_facturas/solicitud_liqui.php?parametro=1" 
               target="_blank"
               class="inline-block bg-usco-vino hover:bg-usco-vino-dark text-white px-6 py-3 rounded-lg transition-colors duration-200 font-usco-bold text-sm shadow-lg hover:shadow-xl mb-4">
              DESCARGAR COMPROBANTE DE PAGO
            </a>
            <p class="text-sm">
              <a href="https://usco.edu.co/inscripciones-2025-2/documentos/instructivo-comprobante-de-pago.pdf" 
                 target="_blank" 
                 class="text-blue-600 underline hover:text-blue-800">
                Instructivo para descargar el Comprobante de pago de la Matrícula
              </a>
            </p>
          </div>
        </div>
      `,
      'academica': `
        <h3 class="text-xl font-usco-condensed-bold mb-4 text-usco-vino">5.6 Matrícula Académica</h3>
        <div class="space-y-4 text-usco-gris-dark font-usco">
          
          <div class="bg-usco-vino-pale p-4 rounded-lg border-l-4 border-usco-vino">
            <h4 class="font-usco-bold text-usco-vino mb-2">MATRÍCULA ACADÉMICA</h4>
            <p class="text-sm">En su calidad de admitido(a) adquirió la responsabilidad de cargar todos los documentos exigidos en la Etapa 1: Matrícula Financiera, de los cuales algunos corresponden a la Matrícula Académica; sin embargo, en las fechas establecidas para la matrícula deberá estar pendiente del correo que indicó en el Formulario de Inscripción, en caso de subsanar algún documento.</p>
          </div>

          <p>En caso de que se le solicite subsanar algún documento académico, podrá realizar el proceso ingresando al siguiente enlace:</p>
          <div class="flex justify-center my-6">
            <a href="https://gaitana.usco.edu.co/admitidos/inicio-sesion" target="_blank" class="bg-usco-vino hover:bg-usco-vino-dark text-white font-usco-bold text-2xl px-16 py-6 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              ACTUALIZAR DOCUMENTOS ACADÉMICOS
            </a>
          </div>
          <p>Una vez la oficina de Registro y Control Académico verifique el cumplimiento de los documentos exigidos para la Matrícula Académica, generará el <strong>ACTA DE MATRÍCULA</strong>, documento que oficializa la calidad de Estudiante de la Universidad Surcolombiana. El mismo será enviado directamente al correo registrado en el formulario de inscripción.</p>

            <h3 class="font-usco-bold text-usco-vino mb-4 text-xl text-center">FECHAS DE MATRÍCULA ACADÉMICA</h3>

<table class="min-w-full border-collapse border border-usco-gris-lighter mt-4 mb-4" style="min-width: 800px;"
  <thead>
    <tr class="bg-usco-gris-pale">
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">PRIMER LLAMADO</th>
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">SEGUNDO LLAMADO</th>
      <th class="border border-usco-gris-lighter p-3 text-left font-usco-bold text-usco-vino">ÚLTIMO LLAMADO</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark"><strong>DEL <strike>2 AL 4</strike><span class="text-green-600 text-xl"><br> 9 Y 10</span> DE DICIEMBRE DE 2025</strong></td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark"><strong>29 Y 30 DE DICIEMBRE DE 2025</strong></td>
      <td class="border border-usco-gris-lighter p-3 text-usco-gris-dark"><strong>28 Y 29 DE ENERO DE 2026</strong> </td>
    </tr>
  </tbody>
</table>
          <div class="bg-usco-gris-pale border-l-4 border-usco-gris-lighter p-4 rounded-lg">
            <h4 class="font-usco-bold text-usco-vino mb-3">IMPORTANTE</h4>
            <p class="text-usco-gris-dark text-sm mb-3">Cuando el aspirante es admitido(a) en un Segundo Llamado o Último Llamado, a otro Programa Académico y tiene legalizada la Matrícula Financiera y Académica, pero desea acogerse a un nuevo Llamado deberá:</p>
            
            <ul class="space-y-2 text-sm text-usco-gris-dark">
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 font-bold flex-shrink-0">1)</span>
                <span>Informar por escrito a la Oficina de Liquidación de Derechos Pecuniarios y Registro Control Académico, la voluntad de acogerse al nuevo llamado adicional, para que se genere a su nombre una nueva liquidación de Matrícula Financiera y compensación de pagos en el nuevo Programa Académico.</span>
              </li>
              <li class="flex items-start">
                <span class="text-usco-vino mr-2 font-bold flex-shrink-0">2)</span>
                <span>El Aspirante que se acoja al nuevo llamado, deberá cumplir con todo el trámite de Matrícula Financiera y Académica, es decir, subir nuevamente los documentos exigidos en el enlace de Admisión al nuevo Programa; generar el Comprobantes y realizar según sea el caso, el pago de la Matrícula Financiera, para que posteriormente la Oficina de Registro y Control, proceda a realizar la Matrícula Académica en las fechas establecidas.</span>
              </li>
            </ul>
            
            <div class="mt-3 p-3 bg-usco-gris-pale rounded">
              <p class="text-usco-vino text-sm font-bold">NOTA: De no realizar el trámite establecido en los numerales anteriores, se entenderá que no acepta el nuevo llamado y continuará en el Programa Académico inicialmente matriculado.</p>
            </div>
          </div>
        </div>
      `
    };

    this.selectedIconInfo.set(iconInfoMap[iconType] || null);
    this.activeIcon.set(iconType);
    this.openingIconPanel.set(true);
    
    // Reiniciar la animación de apertura después de un frame
    setTimeout(() => {
      this.openingIconPanel.set(false);
    }, 50);
  }
}
