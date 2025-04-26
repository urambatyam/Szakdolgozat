<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\User;
/**
 * A felhasználó regisztrálásakor küldöt email
 */
class NewUserRegistered extends Mailable
{
    use Queueable, SerializesModels;
    public User $user;
    public string $plainPassword;
    /**
     * Létrehoza az új üzenet `instance`.
     * @param $user az új felhasználó
     * @param $plainPassword az új felhasználó jelszava
     */
    public function __construct(User $user, string $plainPassword)
    {
        $this->user = $user;
        $this->plainPassword = $plainPassword;
    }

    /**
     * Beállítja az üzenet tárgyát.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Sikeres regisztráció',
        );
    }

    /**
     * At email tartalma.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.new_user_registered', 
            with: [
                'userName' => $this->user->name,
                'userCode' => $this->user->code,
                'userPassword' => $this->plainPassword,
                'loginUrl' => url('/login'),
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
