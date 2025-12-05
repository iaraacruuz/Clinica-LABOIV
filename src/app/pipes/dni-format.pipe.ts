import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dniFormat',
  standalone: true
})
export class DniFormatPipe implements PipeTransform {
  /** Formatea un número de DNI al formato XX.XXX.XXX */
  transform(value: string | number | null | undefined): string {
    if (!value) return 'N/A';

    const dniStr = value.toString().replace(/\D/g, '');
    
    if (dniStr.length === 0) return 'N/A';

    if (dniStr.length <= 2) return dniStr;
    if (dniStr.length <= 5) return `${dniStr.slice(0, 2)}.${dniStr.slice(2)}`;
    return `${dniStr.slice(0, 2)}.${dniStr.slice(2, 5)}.${dniStr.slice(5)}`;
  }
}
