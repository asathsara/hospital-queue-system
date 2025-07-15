function generatePatientId(lastId) {
    if (!lastId) return 'P01';
    const num = parseInt(lastId.replace('P', '')) + 1;
    return 'P' + num.toString().padStart(2, '0');
}

module.exports = { generatePatientId };