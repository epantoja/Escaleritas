import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AcademicoService } from '../services/academico.service';
import { MateriaModel } from '../models/academico.model';
import { SnackBarAnnotatedComponent } from '../../components/snack-bar-annotated/snack-bar-annotated.component';

@Component({
  selector: 'app-materias',
  templateUrl: './materias.component.html',
  styleUrls: ['./materias.component.css'],
})
export class MateriasComponent implements OnInit {
  materias: MateriaModel[] = [];
  busqueda = '';
  areaFiltro = '';
  cargando = false;
  guardando = false;

  mostrarModal = false;
  materiaEditandoId: string | null = null;
  materiaForm!: FormGroup;

  readonly areasAcademicas: string[] = [
    'Matemáticas',
    'Humanidades',
    'Ciencias Naturales',
    'Ciencias Sociales',
    'Idiomas',
    'Artes',
    'Educación Física',
    'Tecnología e Informática',
    'Preescolar Integral',
    'Ética y Valores',
  ];

  constructor(
    private fb: FormBuilder,
    private academicoService: AcademicoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.materiaForm = this.fb.group({
      codigo: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(20)],
      ],
      nombre: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
      ],
      area: ['Matemáticas', [Validators.required]],
      intensidadHoraria: [
        4,
        [Validators.required, Validators.min(1), Validators.max(25)],
      ],
      descripcion: ['', [Validators.maxLength(250)]],
    });

    this.cargarMaterias();
  }

  cargarMaterias(): void {
    this.cargando = true;
    this.academicoService.obtenerMaterias(this.busqueda).subscribe({
      next: (res) => {
        const lista = res.materias || [];
        this.materias = this.areaFiltro
          ? lista.filter((m) => m.area === this.areaFiltro)
          : lista;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.areaFiltro = '';
    this.cargarMaterias();
  }

  abrirModalNueva(): void {
    this.materiaEditandoId = null;
    this.materiaForm.reset({
      area: 'Matemáticas',
      intensidadHoraria: 4,
    });
    this.mostrarModal = true;
  }

  abrirModalEditar(mat: MateriaModel): void {
    this.materiaEditandoId = mat.id;
    this.materiaForm.patchValue({
      codigo: mat.codigo,
      nombre: mat.nombre,
      area: mat.area || 'Matemáticas',
      intensidadHoraria: mat.intensidadHoraria || 4,
      descripcion: mat.descripcion || '',
    });
    this.mostrarModal = true;
  }

  guardarMateria(): void {
    if (this.materiaForm.invalid) {
      this.materiaForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const payload = this.materiaForm.value;

    const req$ = this.materiaEditandoId
      ? this.academicoService.actualizarMateria(this.materiaEditandoId, payload)
      : this.academicoService.crearMateria(payload);

    req$.subscribe({
      next: (res) => {
        this.guardando = false;
        this.mostrarModal = false;
        this.notificar(res.mensaje);
        this.cargarMaterias();
      },
      error: () => {
        this.guardando = false;
      },
    });
  }

  eliminarMateria(mat: MateriaModel): void {
    this.academicoService.eliminarMateria(mat.id).subscribe({
      next: (res) => {
        this.notificar(res.mensaje);
        this.cargarMaterias();
      },
    });
  }

  tieneError(controlName: string, errorName: string): boolean {
    const control = this.materiaForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  private notificar(mensaje: string): void {
    this.snackBar.openFromComponent(SnackBarAnnotatedComponent, {
      data: { mensajes: mensaje, accion: 'Cerrar' },
    });
  }
}

