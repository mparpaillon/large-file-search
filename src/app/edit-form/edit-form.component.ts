import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Line } from 'src/app/line.type';

type DialogData = {
  line: Line;
};

export interface EditFormSubmitData {
  id: string;
  value: {
    title: string,
    year: number,
    genres: string
  };
}

@Component({
  selector: 'app-edit-form',
  templateUrl: './edit-form.component.html',
  styleUrls: ['./edit-form.component.scss']
})
export class EditFormComponent implements OnInit {
  editForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.editForm = this.formBuilder.group({
      title: [ this.data.line.originalTitle, [ Validators.required, Validators.maxLength(100) ] ],
      year: [ this.data.line.year, [ Validators.required, Validators.pattern('\d{4}') ] ],
      genres: [ this.data.line.genres, [ Validators.required ]]
    });
  }

  save() {
    this.dialogRef.close({
      id: this.data.line.id,
      value: this.editForm.value
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
