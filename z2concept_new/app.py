import os
import sqlite3
import smtplib
import secrets
import hashlib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps
from werkzeug.utils import secure_filename

from flask import (
    Flask, render_template, request, redirect,
    url_for, flash, session, g, jsonify
)

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "z2concept-secret-2025")

DATABASE   = "bookings.db"
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "z2concept2025")
GMAIL_USER = os.environ.get("GMAIL_USER", "kefeetxtu@gmail.com")
GMAIL_PASS = os.environ.get("GMAIL_PASS", "mvjrrtdrgbmcjzkz")
NOTIFY_EMAIL = "kefeetxtu@gmail.com"
BASE_URL   = os.environ.get("BASE_URL", "http://127.0.0.1:5000")

CLOUDINARY_CLOUD = os.environ.get("CLOUDINARY_CLOUD", "dekw9tcyl")

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

SERVICES = [
    "Events", "Wedding", "Birthday", "Funeral",
    "Real Estate", "Baby Shower", "Graduation",
    "Flyer Design", "Logo Design", "Website Design", "Other"
]

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def hash_password(p):
    return hashlib.sha256(p.encode()).hexdigest()

def check_password(p, h):
    return hashlib.sha256(p.encode()).hexdigest() == h

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_db(exc):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        db.execute("""CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            is_verified INTEGER DEFAULT 0,
            verify_token TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )""")
        db.execute("""CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            service TEXT NOT NULL,
            event_date TEXT NOT NULL,
            event_time TEXT NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT (datetime('now'))
        )""")
        db.execute("""CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            caption TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )""")
        db.commit()

def send_email(to_addr, subject, html_body):
    if not GMAIL_PASS:
        print(f"[EMAIL SKIPPED] {subject}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Z2 Concept <{GMAIL_USER}>"
        msg["To"] = to_addr
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(GMAIL_USER, GMAIL_PASS)
            s.sendmail(GMAIL_USER, to_addr, msg.as_string())
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")

def send_verification_email(name, email, token):
    url = f"{BASE_URL}/verify/{token}"
    send_email(email, "Confirm your Z2 Concept account", f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0a0a0a;color:#f5f5f0;padding:40px;">
      <h1 style="color:#E87722;">CONFIRM YOUR ACCOUNT</h1>
      <p>Hey <strong>{name}</strong>! Click below to verify your email.</p>
      <div style="text-align:center;margin:40px 0;">
        <a href="{url}" style="background:#E87722;color:#000;padding:16px 40px;text-decoration:none;font-weight:bold;font-size:1rem;">VERIFY MY ACCOUNT</a>
      </div>
      <p style="color:#555;font-size:0.8rem;">Or copy: <a href="{url}" style="color:#E87722;">{url}</a></p>
    </div>""")

def send_welcome_email(name, email):
    send_email(email, "You're in! - Z2 Concept", f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0a0a0a;color:#f5f5f0;padding:40px;">
      <h1 style="color:#E87722;">WELCOME TO Z2 CONCEPT!</h1>
      <p>Hey <strong>{name}</strong>, your account is now active. You can now book sessions with us.</p>
      <div style="text-align:center;margin:36px 0;">
        <a href="{BASE_URL}/login" style="background:#E87722;color:#000;padding:14px 36px;text-decoration:none;font-weight:bold;">LOG IN NOW</a>
      </div>
      <p style="color:#888;">+1 224 900 0540 - Your Feature Is Today.</p>
    </div>""")

def notify_admin(b):
    send_email(NOTIFY_EMAIL, f"New Booking - {b['name']} ({b['service']})", f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0a0a0a;color:#f5f5f0;padding:32px;">
      <h1 style="color:#E87722;">NEW BOOKING</h1>
      <p><b>Name:</b> {b['name']}</p><p><b>Email:</b> {b['email']}</p>
      <p><b>Phone:</b> {b['phone']}</p><p><b>Service:</b> {b['service']}</p>
      <p><b>Date:</b> {b['event_date']} at {b['event_time']}</p>
      <p><b>Message:</b> {b['message'] or '-'}</p>
    </div>""")

def confirm_client(b):
    send_email(b['email'], "Booking Received - Z2 Concept", f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;background:#0a0a0a;color:#f5f5f0;padding:32px;">
      <h1 style="color:#E87722;">WE GOT YOUR BOOKING!</h1>
      <p>Hey <strong>{b['name']}</strong>, we received your <strong>{b['service']}</strong> request for {b['event_date']} at {b['event_time']}.</p>
      <p>We will be in touch shortly. Call/WhatsApp: <a href="tel:+12249000540" style="color:#E87722;">+1 224 900 0540</a></p>
    </div>""")

def user_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("user_id"):
            flash("Login required to make a booking.", "warning")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)
    return decorated

@app.context_processor
def inject_user():
    user = None
    if session.get("user_id"):
        user = get_db().execute("SELECT * FROM users WHERE id=?", (session["user_id"],)).fetchone()
    return {"current_user": user}

# Hardcoded Cloudinary photos — update public IDs here anytime
CLOUDINARY_PHOTOS = [
    # WEDDINGS
    {"id": "WeddingDSC01008-2Photos_srgbzg", "caption": "weddings"},
    {"id": "WeddingDSC01016-1Photos_hxlopa", "caption": "weddings"},
    {"id": "WeddingDSC01049-1Photos_adnvwu", "caption": "weddings"},
    {"id": "WeddingDSC00924-2Photos_xwtwst", "caption": "weddings"},
    {"id": "Wedding2_o6jkqm", "caption": "weddings"},
    {"id": "WeddingDSC00847Photos_mvpptq", "caption": "weddings"},
    {"id": "WeddingDSC00881-1Photos_usrbcs", "caption": "weddings"},
    {"id": "Wedding_ewwodp", "caption": "weddings"},
    {"id": "WeddingDSC00851Photos_r0xqiz", "caption": "weddings"},
    {"id": "WeddingDSC00879-1Photos_ceu3", "caption": "weddings"},
    {"id": "WeddingDSC00975-1Photos_q2lqrn", "caption": "weddings"},
    {"id": "WeddingP_R-Standesamt-069_1_gv4kdd", "caption": "weddings"},
    {"id": "WeddingP_R-Standesamt-086_1_qfrkgj", "caption": "weddings"},
    {"id": "WeddingP_R-Standesamt-060_qkf5l9", "caption": "weddings"},
    {"id": "WeddingP_R-Standesamt-071_ib03wm", "caption": "weddings"},
    {"id": "WeddingP_R-Standesamt-064_zghn37", "caption": "weddings"},
    # BIRTHDAYS
    {"id": "Birthdaysimage00018_mcue67", "caption": "birthdays"},
    {"id": "BirthdaysDSC00067a_hj6x3j", "caption": "birthdays"},
    {"id": "Birthdaysimage00014_qymeso", "caption": "birthdays"},
    {"id": "Birthdaysimage00017_rhu6ng", "caption": "birthdays"},
    {"id": "BirthdaysDSC00026a_ckmow5", "caption": "birthdays"},
    {"id": "Birthdaysimage00011_ptg6vt", "caption": "birthdays"},
    {"id": "Birthdaysimage00001_ewmkkc", "caption": "birthdays"},
    {"id": "BirthdaysDSC00070_ddhfps", "caption": "birthdays"},
    {"id": "BirthdaysDSC00061_axeybv", "caption": "birthdays"},
    {"id": "BirthdaysDSC00048_cizthq", "caption": "birthdays"},
    {"id": "Birthdaysimage00010_muq0xn", "caption": "birthdays"},
    {"id": "Birthdaysimage00008_ajbuft", "caption": "birthdays"},
    {"id": "Birthdaysimage00007_tjyrpm", "caption": "birthdays"},
    {"id": "BirthdaysDSC00054_gydxax", "caption": "birthdays"},
    {"id": "656251185_1413698020802827_5479065206795647904_n_oqp6wo", "caption": "birthdays"},
    {"id": "654800285_1413697914136171_6470243813399565788_n_gh6di4", "caption": "birthdays"},
    {"id": "655508905_1413697944136168_7858579123878504310_n_of0kha", "caption": "birthdays"},
]

def get_photos():
    photos = []
    for p in CLOUDINARY_PHOTOS:
        photos.append({
            "filename": f"https://res.cloudinary.com/{CLOUDINARY_CLOUD}/image/upload/{p['id']}",
            "caption": p["caption"],
            "is_cloudinary": True
        })
    return photos

# ── PAGES ──────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html", active="home", photos=get_photos())

@app.route("/gallery")
def gallery():
    return render_template("gallery.html", active="gallery", photos=get_photos())

@app.route("/about")
def about():
    return render_template("about.html", active="about")

@app.route("/booking")
def booking():
    return render_template("booking.html", active="booking")

@app.route("/contact", methods=["GET", "POST"])
def contact():
    success = False
    error = None
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        subject = request.form.get("subject", "").strip()
        message = request.form.get("message", "").strip()
        if not all([name, email, subject, message]):
            error = "Please fill in all fields."
        else:
            send_email(NOTIFY_EMAIL, f"Contact: {subject} - {name}", f"""
            <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f5f5f0;padding:32px;">
              <h2 style="color:#E87722;">CONTACT MESSAGE</h2>
              <p><b>Name:</b> {name}</p><p><b>Email:</b> {email}</p>
              <p><b>Subject:</b> {subject}</p><p><b>Message:</b><br>{message}</p>
            </div>""")
            success = True
    return render_template("index.html", active="home", photos=get_photos(), success=success, error=error)

# ── AUTH ───────────────────────────────────────────────────────────────────
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if session.get("user_id"):
        return redirect(url_for("index"))
    errors = []
    name = email = ""
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm = request.form.get("confirm_password", "")
        if not name: errors.append("Name is required.")
        if not email: errors.append("Email is required.")
        if len(password) < 6: errors.append("Password must be at least 6 characters.")
        if password != confirm: errors.append("Passwords do not match.")
        if not errors:
            db = get_db()
            if db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
                errors.append("An account with this email already exists.")
            else:
                token = secrets.token_urlsafe(32)
                db.execute("INSERT INTO users (name,email,password_hash,verify_token) VALUES (?,?,?,?)",
                           (name, email, hash_password(password), token))
                db.commit()
                send_verification_email(name, email, token)
                flash("Account created! Check your email to verify before logging in.", "success")
                return redirect(url_for("login"))
    return render_template("signup.html", errors=errors, name=name, email=email)

@app.route("/verify/<token>")
def verify_email(token):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE verify_token=?", (token,)).fetchone()
    if not user:
        flash("Invalid or expired verification link.", "error")
        return redirect(url_for("login"))
    if user["is_verified"]:
        flash("Already verified. Please log in.", "info")
        return redirect(url_for("login"))
    db.execute("UPDATE users SET is_verified=1, verify_token=NULL WHERE id=?", (user["id"],))
    db.commit()
    send_welcome_email(user["name"], user["email"])
    flash("Email verified! Your account is active.", "success")
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if session.get("user_id"):
        return redirect(url_for("index"))
    error = None
    email = ""
    show_resend = False
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not user or not check_password(password, user["password_hash"]):
            error = "Invalid email or password."
        elif not user["is_verified"]:
            error = "Please verify your email first. Check your inbox."
            show_resend = True
        else:
            session["user_id"] = user["id"]
            session["user_name"] = user["name"]
            flash(f"Welcome back, {user['name']}!", "success")
            return redirect(request.args.get("next") or url_for("index"))
    return render_template("login.html", error=error, email=email, show_resend=show_resend)

@app.route("/resend-verification", methods=["POST"])
def resend_verification():
    email = request.form.get("email", "").strip().lower()
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email=? AND is_verified=0", (email,)).fetchone()
    if user:
        token = secrets.token_urlsafe(32)
        db.execute("UPDATE users SET verify_token=? WHERE id=?", (token, user["id"]))
        db.commit()
        send_verification_email(user["name"], email, token)
    flash("If that email exists and is unverified, a new link has been sent.", "info")
    return redirect(url_for("login"))

@app.route("/logout")
def logout():
    session.pop("user_id", None)
    session.pop("user_name", None)
    flash("You have been logged out.", "info")
    return redirect(url_for("index"))

# ── BOOKING ────────────────────────────────────────────────────────────────
@app.route("/book", methods=["POST"])
@user_required
def book():
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    phone = request.form.get("phone", "").strip()
    service = request.form.get("service", "").strip()
    event_date = request.form.get("event_date", "").strip()
    event_time = request.form.get("event_time", "").strip()
    message = request.form.get("message", "").strip()
    errors = []
    if not name: errors.append("Name is required.")
    if not email: errors.append("Email is required.")
    if not phone: errors.append("Phone is required.")
    if not service: errors.append("Please select a service.")
    if not event_date: errors.append("Date is required.")
    if not event_time: errors.append("Time is required.")
    if errors:
        return jsonify({"success": False, "errors": errors}), 400
    db = get_db()
    db.execute("INSERT INTO bookings (user_id,name,email,phone,service,event_date,event_time,message) VALUES (?,?,?,?,?,?,?,?)",
               (session["user_id"], name, email, phone, service, event_date, event_time, message))
    db.commit()
    b = {"name": name, "email": email, "phone": phone, "service": service,
         "event_date": event_date, "event_time": event_time, "message": message}
    notify_admin(b)
    confirm_client(b)
    return jsonify({"success": True, "message": "Booking received! Check your email for confirmation."})

# ── ADMIN ──────────────────────────────────────────────────────────────────
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    error = None
    if request.method == "POST":
        if request.form.get("username") == ADMIN_USER and request.form.get("password") == ADMIN_PASS:
            session["admin_logged_in"] = True
            return redirect(url_for("admin_dashboard"))
        error = "Invalid credentials."
    return render_template("admin_login.html", error=error)

@app.route("/admin/logout")
def admin_logout():
    session.pop("admin_logged_in", None)
    return redirect(url_for("admin_login"))

@app.route("/admin")
@admin_required
def admin_dashboard():
    db = get_db()
    status = request.args.get("status", "all")
    search = request.args.get("q", "").strip()
    query = "SELECT * FROM bookings WHERE 1=1"
    params = []
    if status != "all":
        query += " AND status=?"; params.append(status)
    if search:
        query += " AND (name LIKE ? OR email LIKE ? OR service LIKE ?)"
        like = f"%{search}%"; params.extend([like, like, like])
    query += " ORDER BY created_at DESC"
    bookings = db.execute(query, params).fetchall()
    counts = {r["status"]: r["n"] for r in db.execute("SELECT status, COUNT(*) as n FROM bookings GROUP BY status").fetchall()}
    total = db.execute("SELECT COUNT(*) FROM bookings").fetchone()[0]
    users_total = db.execute("SELECT COUNT(*) FROM users WHERE is_verified=1").fetchone()[0]
    photos = db.execute("SELECT * FROM photos ORDER BY created_at DESC").fetchall()
    return render_template("admin_dashboard.html", bookings=bookings, status_filter=status,
        search=search, count_map=counts, total=total, users_total=users_total, db_photos=photos)

@app.route("/admin/booking/<int:bid>/status", methods=["POST"])
@admin_required
def update_status(bid):
    s = request.form.get("status")
    if s in ("pending", "confirmed", "completed", "cancelled"):
        db = get_db(); db.execute("UPDATE bookings SET status=? WHERE id=?", (s, bid)); db.commit()
    return redirect(request.referrer or url_for("admin_dashboard"))

@app.route("/admin/booking/<int:bid>/delete", methods=["POST"])
@admin_required
def delete_booking(bid):
    db = get_db(); db.execute("DELETE FROM bookings WHERE id=?", (bid,)); db.commit()
    return redirect(url_for("admin_dashboard"))

@app.route("/admin/photos/upload", methods=["POST"])
@admin_required
def upload_photo():
    caption = request.form.get("caption", "").strip()
    file = request.files.get("photo")
    if file and allowed_file(file.filename):
        filename = secrets.token_hex(8) + "_" + secure_filename(file.filename)
        file.save(os.path.join(UPLOAD_FOLDER, filename))
        db = get_db()
        db.execute("INSERT INTO photos (filename, caption) VALUES (?,?)", (filename, caption))
        db.commit()
        flash("Photo uploaded.", "success")
    else:
        flash("Invalid file type.", "error")
    return redirect(url_for("admin_dashboard"))

@app.route("/admin/photos/<int:pid>/delete", methods=["POST"])
@admin_required
def delete_photo(pid):
    db = get_db()
    photo = db.execute("SELECT * FROM photos WHERE id=?", (pid,)).fetchone()
    if photo:
        fp = os.path.join(UPLOAD_FOLDER, photo["filename"])
        if os.path.exists(fp): os.remove(fp)
        db.execute("DELETE FROM photos WHERE id=?", (pid,)); db.commit()
        flash("Photo deleted.", "info")
    return redirect(url_for("admin_dashboard"))

with app.app_context():
    init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
