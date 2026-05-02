<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AdminNewUserRegistered extends BaseNotificationMail
{
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject('admin_new_user'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: $this->getView('admin-new-user-registered'),
            with: [
                'user' => $this->user,
                'newUser' => $this->data,
            ],
        );
    }
}
