<?php

use App\Models\Registration;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->string('church_group')->default(Registration::GROUP_GUEST)->after('church')->index();
            $table->string('role')->nullable()->after('church_group');
            // No longer asked on the form; kept for registrations made before.
            $table->string('city')->nullable()->change();
        });

        // Classify registrations made before the category existed.
        DB::table('registrations')
            ->where('church', Registration::HOST_CHURCH)
            ->update(['church_group' => Registration::GROUP_HOST]);

        DB::table('registrations')
            ->where('church', '!=', Registration::HOST_CHURCH)
            ->whereRaw('LOWER(church) LIKE ?', ['%foursquare%'])
            ->update(['church_group' => Registration::GROUP_FOURSQUARE]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn(['church_group', 'role']);
        });
    }
};
