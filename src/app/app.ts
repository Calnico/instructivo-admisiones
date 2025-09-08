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
      title: 'Oferta Académica',
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
      title: 'Consultar costos',
      description: 'Revisa los valores de matrícula para tu programa',
      detailedInfo: 'Consulta en el sistema los costos de matrícula según tu programa académico, estrato socioeconómico y modalidad de estudio.',
      requirements: ['Certificado de estrato', 'Información del programa académico'],
      tips: ['Los costos pueden variar según el estrato', 'Consulta opciones de financiamiento disponibles']
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
    },
    {
      number: 6,
      title: 'Elegir horarios',
      description: 'Selecciona los horarios que mejor se ajusten',
      detailedInfo: 'Para cada materia seleccionada, escoge el grupo y horario disponible. Verifica que no haya cruces de horarios entre materias.',
      requirements: ['Materias seleccionadas', 'Disponibilidad de horarios'],
      tips: ['Evita cruces de horarios', 'Considera tiempos de desplazamiento entre clases']
    },
    {
      number: 7,
      title: 'Confirmar inscripción',
      description: 'Finaliza tu inscripción de materias',
      detailedInfo: 'Revisa cuidadosamente todas las materias y horarios seleccionados, luego confirma tu inscripción. Una vez confirmada, los cambios son limitados.',
      requirements: ['Materias y horarios seleccionados'],
      tips: ['Revisa todo antes de confirmar', 'Los cambios posteriores tienen restricciones']
    },
    {
      number: 8,
      title: 'Generar comprobante',
      description: 'Descarga tu certificado de matrícula',
      detailedInfo: 'Una vez completado el proceso, genera y descarga tu comprobante de matrícula. Este documento certifica tu inscripción oficial.',
      requirements: ['Proceso de matrícula completado'],
      tips: ['Descarga el PDF del comprobante', 'Imprime una copia para tus archivos']
    },
    {
      number: 9,
      title: 'Verificar matrícula',
      description: 'Confirma que tu matrícula esté activa',
      detailedInfo: 'Verifica en el sistema que tu estado sea "MATRICULADO" y que todas las materias aparezcan correctamente registradas.',
      requirements: ['Comprobante de matrícula'],
      tips: ['Guarda tu comprobante', 'Contacta soporte si hay inconsistencias']
    }
  ];

  showDialog(step: Step) {
    this.selectedStep.set(step);
    this.closing.set(false);
    this.visible.set(true);
    this.selectedPdfIndex.set(0);
    
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
}
