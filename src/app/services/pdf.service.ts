import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { MedicalHistoryRecord } from './medical-history.service';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  /**
   * Genera PDF con historia clínica del paciente
   */
  async generateMedicalHistoryPDF(
    patientName: string,
    patientLastName: string,
    patientDni: string | undefined,
    patientAge: number | undefined,
    medicalHistory: MedicalHistoryRecord[]
  ): Promise<void> {
    const doc = new jsPDF();
    
    const logoSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="#0E7490"/>
        <circle cx="50" cy="50" r="40" fill="#67E8F9"/>
        <rect x="45" y="25" width="10" height="50" rx="2" fill="#0E7490"/>
        <rect x="25" y="45" width="50" height="10" rx="2" fill="#0E7490"/>
      </svg>
    `;
    
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgBlob = new Blob([logoSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    await new Promise<void>((resolve) => {
      img.onload = () => {
        ctx?.drawImage(img, 0, 0, 100, 100);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 15, 10, 20, 20);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.src = url;
    });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CLÍNICA ONLINE', 40, 20);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Historia Clínica del Paciente', 40, 28);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Fecha de emisión: ${currentDate}`, 40, 34);
    
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);
    
    let yPos = 50;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PACIENTE', 15, yPos);
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre Completo: ${patientName} ${patientLastName}`, 15, yPos);
    
    yPos += 6;
    if (patientDni) {
      doc.text(`DNI: ${patientDni}`, 15, yPos);
      yPos += 6;
    }
    
    if (patientAge) {
      doc.text(`Edad: ${patientAge} años`, 15, yPos);
      yPos += 6;
    }
    
    yPos += 5;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('HISTORIAL MÉDICO', 15, yPos);
    
    yPos += 8;
    
    if (medicalHistory.length === 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.text('El paciente no tiene registros médicos.', 15, yPos);
    } else {
      const sortedHistory = [...medicalHistory].sort((a, b) => {
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return dateB - dateA;
      });

      sortedHistory.forEach((record, index) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFillColor(52, 152, 219);
        doc.rect(15, yPos - 5, 180, 8, 'F');
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`Consulta #${index + 1}`, 17, yPos);
        
        doc.setTextColor(0, 0, 0);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const recordDate = new Date(record.created_at || '').toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.text(`Fecha: ${recordDate}`, 17, yPos);
        yPos += 5;
        
        if (record.specialist) {
          doc.text(`Especialista: Dr. ${record.specialist.name} ${record.specialist.last_name}`, 17, yPos);
          yPos += 5;
        }
        
        yPos += 2;
        
        if (record.height || record.weight || record.temperature || record.pressure) {
          doc.setFont('helvetica', 'bold');
          doc.text('Datos Físicos:', 17, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 5;
          
          const physicalData: string[] = [];
          if (record.height) physicalData.push(`Altura: ${record.height} cm`);
          if (record.weight) physicalData.push(`Peso: ${record.weight} kg`);
          if (record.temperature) physicalData.push(`Temperatura: ${record.temperature} °C`);
          if (record.pressure) physicalData.push(`Presión: ${record.pressure}`);
          
          physicalData.forEach(data => {
            doc.text(`  • ${data}`, 17, yPos);
            yPos += 5;
          });
          
          yPos += 2;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text('Diagnóstico:', 17, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 5;
        
        const diagnosisLines = doc.splitTextToSize(record.diagnosis, 170);
        diagnosisLines.forEach((line: string) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, 17, yPos);
          yPos += 5;
        });
        
        yPos += 2;
        
        if (record.observations) {
          doc.setFont('helvetica', 'bold');
          doc.text('Observaciones:', 17, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 5;
          
          const observationsLines = doc.splitTextToSize(record.observations, 170);
          observationsLines.forEach((line: string) => {
            if (yPos > 280) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(line, 17, yPos);
            yPos += 5;
          });
          
          yPos += 2;
        }
        
        if (record.additional_fields && record.additional_fields.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Información Adicional:', 17, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 5;
          
          record.additional_fields.forEach(field => {
            if (yPos > 280) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`  • ${field.key}: ${field.value}`, 17, yPos);
            yPos += 5;
          });
        }
        
        yPos += 8;
      });
    }
    
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    const fileName = `Historia_Clinica_${patientName}_${patientLastName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}
