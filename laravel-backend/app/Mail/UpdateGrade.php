<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
/**
 * A Jegybeírásról küldöt email
 */
class UpdateGrade extends Mailable
{
    use Queueable, SerializesModels;
    public string $grade;
    public string $courseName;
    /**
     * Létrehoza az új üzenet `instance`.
     * @param $grade az új jegy
     * @param $courseName a kurzusnév
     */
    public function __construct($grade, $courseName)
    {
        $this->grade = $grade;
        $this->courseName = $courseName;
    }


    /**
     * Beállítja az üzenet tárgyát.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Jegybeírás',
        );
    }

    /**
     * At email tartalma.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.update_grade', 
            with: [
                'grade' => $this->grade,
                'courseName' => $this->courseName,
            ],
        );
    }

    /**
     * Hozzáadja az estleges csotolmányokat az üzenethez.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
