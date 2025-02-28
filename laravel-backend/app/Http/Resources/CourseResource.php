<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'kredit' => $this->kredit,
            'recommendedSemester' => $this->recommendedSemester,
            'user_code' => $this->user_code,
            'subjectMatter' => $this->subjectMatter,
            'sezon' => $this->sezon === null ? null : (bool)$this->sezon,
        ];
    }
}
