<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
/**
 * A felhasználó modelje
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected $primaryKey = 'code'; 
    public $incrementing = false; 
    protected $keyType = 'string';

    /**
     * A tulajdonságok, amelyek tömegesen hozzárendelhetők.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'code',
        'curriculum_id'
    ];

    /**
     * A tulajdonságok, amelyeket el kell rejteni a JSON szerializálás során
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Automatikusan kasztolja az tulajdonságok a megadott adattípusokra
     * 
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    /**
     * Lekéri a felhasználóhoz tartozó tantervet.
     * Egy felhasználó egy tantervhez tartozik.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function curriculum()
    {
        return $this->belongsTo(Curriculum::class, 'curriculum_id');
    }
    /**
     * Lekéri a felhasználóhoz  tartozó kurzusokat.
     * Egy felhasználó több kurzusért is felelős lehet.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function course()
    {
        return $this->hasMany(Course::class, 'user_code', 'code');
    }
    /**
     * Lekéri a felhasználó által írt fórumbejegyzéseket.
     * Egy felhasználó több fórumbejegyzést is írhat.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function forums()
    {
        return $this->hasMany(CourseForum::class, 'user_code', 'code');
    }
    /**
     * Lekéri a felhasználóhoz tartozó érdemjegyeket.
     * Egy felhasználónak több érdemjegye is lehet.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function grades()
    {
        return $this->hasMany(Grade::class, 'user_code', 'code');
    }
}
