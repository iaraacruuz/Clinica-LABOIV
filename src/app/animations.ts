import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

/**
 * Animación de entrada con fade in desde arriba
 */
export const fadeInDown = trigger('fadeInDown', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-20px)' }),
    animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

/**
 * Animación de entrada con fade in desde la izquierda
 */
export const fadeInLeft = trigger('fadeInLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-30px)' }),
    animate('500ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

/**
 * Animación de entrada con fade in desde la derecha
 */
export const fadeInRight = trigger('fadeInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(30px)' }),
    animate('500ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
]);

/**
 * Animación de fade in simple
 */
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('300ms ease-in', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-out', style({ opacity: 0 }))
  ])
]);

/**
 * Animación de escala (zoom in)
 */
export const zoomIn = trigger('zoomIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.8)' }),
    animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', 
      style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

/**
 * Animación de slide desde abajo
 */
export const slideInUp = trigger('slideInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(50px)' }),
    animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', 
      style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

/**
 * Animación para listas con stagger effect
 */
export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger('100ms', [
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);

/**
 * Animación para rutas/componentes
 */
export const routeTransition = trigger('routeTransition', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0, transform: 'translateX(30px)' })
    ], { optional: true }),
    query(':leave', [
      animate('300ms ease-out', style({ opacity: 0, transform: 'translateX(-30px)' }))
    ], { optional: true }),
    query(':enter', [
      animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
    ], { optional: true })
  ])
]);

/**
 * Animación de rebote al entrar
 */
export const bounceIn = trigger('bounceIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.3)' }),
    animate('600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
      style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

/**
 * Animación de rotación al entrar
 */
export const rotateIn = trigger('rotateIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'rotate(-180deg) scale(0.5)' }),
    animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', 
      style({ opacity: 1, transform: 'rotate(0) scale(1)' }))
  ])
]);

/**
 * Animación de slide desde la derecha hacia la izquierda
 */
export const slideInFromRight = trigger('slideInFromRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(100%)' }),
    animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', 
      style({ opacity: 1, transform: 'translateX(0)' }))
  ]),
  transition(':leave', [
    animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', 
      style({ opacity: 0, transform: 'translateX(-100%)' }))
  ])
]);

/**
 * Animación de slide desde la izquierda hacia la derecha
 */
export const slideInFromLeft = trigger('slideInFromLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-100%)' }),
    animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', 
      style({ opacity: 1, transform: 'translateX(0)' }))
  ]),
  transition(':leave', [
    animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', 
      style({ opacity: 0, transform: 'translateX(100%)' }))
  ])
]);
