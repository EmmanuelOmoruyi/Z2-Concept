import sqlite3
import sqlite3

db = sqlite3.connect('bookings.db')
db.execute('DELETE FROM photos')
photos = [
    ('485148855_1106713074834658_1007018805585680720_n.jpg', 'Event'),
    ('485410247_1106713314834634_1020997389437896831_n.jpg', 'Wedding'),
    ('486315584_1106713061501326_5011477938717597358_n.jpg', 'Birthday'),
    ('654800285_1413697914136171_6470243813399565788_n.jpg', 'Event'),
    ('655508905_1413697944136168_7858579123878504310_n.jpg', 'Graduation'),
    ('656251185_1413698020802827_5479065206795647904_n.jpg', 'Wedding'),
]
db.executemany('INSERT INTO photos (filename, caption) VALUES (?,?)', photos)
db.commit()
print('Done!', db.execute('SELECT COUNT(*) FROM photos').fetchone()[0], 'photos registered.')
db.close()