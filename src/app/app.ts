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
  modalidades?: { name: string; content: string }[];
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
  protected safePdfUrl = signal<SafeResourceUrl | null>(null);
  protected showSteps = signal<boolean>(true);
  protected visibleTerms = signal(false);
  protected closingTerms = signal(false);
  protected visibleGratuidad = signal(false);
  protected closingGratuidad = signal(false);
  protected selectedModalidadIndex = signal<number>(0);
  
  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);
  
  constructor() {
    this.isBrowser.set(isPlatformBrowser(this.platformId));
  }
  
  ngAfterViewInit() {
    if (this.isBrowser()) {
      this.loadPdfJs();
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
    // Crear URL segura para Angular
    this.safePdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  selectModalidad(index: number) {
    this.selectedModalidadIndex.set(index);
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
      title: '1. OFERTA ACADÉMICA - NUESTROS PROGRAMAS ACADEMICOS',
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
          content: `Esta modalidad está dirigida a aspirantes que ingresan únicamente por el puntaje obtenido en las pruebas Saber 11 (ICFES).

**Descripción**
Los cupos se asignan en orden descendente según el puntaje obtenido en las pruebas Saber 11, hasta completar los cupos disponibles para cada programa académico.

**Requisitos**
• Presentar las pruebas Saber 11 con máximo 10 años de antigüedad (desde 2015)
• Cumplir con el puntaje mínimo establecido para el programa
• Completar el proceso de inscripción en las fechas establecidas
• Pagar los derechos de inscripción

**Documentación necesaria**
• Fotocopia de la cédula de ciudadanía
• Certificado y acta de grado de bachiller
• Resultados de las pruebas Saber 11
• Comprobante de pago de inscripción`
        },
        {
          name: 'Por Regímenes Especiales',
          content: `Modalidad para grupos poblacionales específicos que requieren atención diferencial y acciones afirmativas.

**Grupos incluidos**
• Comunidades indígenas
• Comunidades afrocolombianas, raizales y palenqueras
• Población víctima del conflicto armado
• Población con discapacidad
• Deportistas destacados a nivel nacional e internacional
• Mejores bachilleres del departamento del Huila

**Proceso de inscripción**
El aspirante debe acreditar su pertenencia al grupo poblacional correspondiente mediante la documentación específica requerida por cada categoría.

**Documentación adicional**
• Certificación de pertenencia étnica (para comunidades indígenas y afrocolombianas)
• Registro único de víctimas (para víctimas del conflicto)
• Certificado de discapacidad del Ministerio de Salud
• Certificaciones deportivas oficiales
• Diploma de mejor bachiller departamental`
        },
        {
          name: 'Por Convenio con Escuelas Normales',
          content: `Dirigida exclusivamente a normalistas superiores graduados de instituciones que mantienen convenio vigente con la Universidad Surcolombiana.

**Programas disponibles**
Esta modalidad aplica específicamente para los programas de Licenciatura que tengan convenio establecido con Escuelas Normales Superiores.

**Requisitos específicos**
• Título de Normalista Superior debidamente registrado
• Institución de origen con convenio vigente con la USCO
• Cumplir con los términos específicos establecidos en el convenio
• Presentación de documentación que acredite la graduación como normalista

**Documentación requerida**
• Diploma y acta de grado de Normalista Superior
• Certificado de notas de la formación normalista
• Constancia de la institución sobre el convenio vigente
• Documentos de identidad y bachillerato`
        },
        {
          name: 'Por Transferencia Académica',
          content: `Para estudiantes que desean continuar sus estudios en la Universidad Surcolombiana provenientes de otras instituciones de educación superior.

**Tipos de transferencia**
• **Transferencia externa**: Desde otras universidades hacia la USCO
• **Transferencia interna**: Entre programas de la misma USCO
• **Reingreso**: Estudiantes que estuvieron matriculados anteriormente en la USCO

**Requisitos generales**
• Haber aprobado mínimo dos (2) semestres académicos
• Certificado de calificaciones de la universidad de origen
• Contenidos programáticos de las materias aprobadas
• Estar a paz y salvo con la institución de origen
• No estar sancionado académica o disciplinariamente

**Proceso de homologación**
Las materias aprobadas en la institución de origen serán evaluadas por el comité de programa correspondiente para determinar las equivalencias y homologaciones respectivas.`
        }
      ]
    },
    {
      number: 3,
      title: 'Realizar pago',
      description: 'Efectúa el pago de los derechos de matrícula',
      detailedInfo: 'Realiza el pago a través de los medios habilitados: PSE, tarjeta de crédito, efectivo en bancos autorizados o consignación.',
      requirements: ['Medio de pago válido', 'Valor exacto de la matrícula'],
      tips: ['Conserva el comprobante de pago', 'El pago puede tomar hasta 24 horas en reflejarse']
    },
    {
      number: 4,
      title: 'Generar PIN',
      description: 'Obtén tu PIN de matrícula después del pago',
      detailedInfo: 'Una vez confirmado el pago, el sistema generará automáticamente tu PIN de matrícula. Este código es necesario para continuar con el proceso.',
      requirements: ['Pago confirmado', 'Acceso al sistema académico'],
      tips: ['Anota tu PIN en un lugar seguro', 'El PIN tiene vigencia limitada']
    },
    {
      number: 5,
      title: 'Seleccionar materias',
      description: 'Escoge las materias de tu semestre académico',
      detailedInfo: 'Consulta el plan de estudios y selecciona las materias correspondientes a tu semestre. Verifica prerrequisitos y cupos disponibles.',
      requirements: ['PIN de matrícula', 'Plan de estudios del programa'],
      tips: ['Revisa los prerrequisitos de cada materia', 'Ten alternativas por si no hay cupos']
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
    
    // Para el paso 1, cargar automáticamente el primer PDF
    if (step.number === 1 && step.pdfs && step.pdfs.length > 0) {
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
}
