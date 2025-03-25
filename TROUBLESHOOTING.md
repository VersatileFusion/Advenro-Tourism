# Troubleshooting Guide: Node.js on cPanel/Ubuntu

This guide covers common issues you might encounter when deploying a Node.js application to cPanel on an Ubuntu server, along with their solutions.

## Application Won't Start

### Issue: Application Status Shows "Stopped" or "Failed to Start"

1. **Check Application Logs**
   - In cPanel, go to the "Node.js" section
   - Click on your application
   - Review the application logs for error messages

2. **Common Error Messages and Solutions**

   - **"Port already in use"**
     ```
     Error: listen EADDRINUSE: address already in use :::3000
     ```
     **Solution**: Change the port in your environment variables or check if another application is using port 3000.

   - **"Module not found"**
     ```
     Error: Cannot find module 'express'
     ```
     **Solution**: Run `npm install` to install dependencies or check if the package is listed in package.json.

   - **"Permission denied"**
     ```
     Error: EACCES: permission denied
     ```
     **Solution**: Check file permissions. Files should be owned by your cPanel user, not root.

   - **"MongoDB connection error"**
     ```
     MongoNetworkError: failed to connect to server
     ```
     **Solution**: Verify MongoDB connection string and credentials. Make sure MongoDB is running.

## Database Connection Issues

### Issue: Cannot Connect to MongoDB

1. **Local MongoDB on Server**
   - Verify MongoDB is installed and running: `systemctl status mongodb`
   - Check MongoDB is listening on the correct port: `netstat -plntu | grep mongo`
   - Verify credentials: Try connecting manually with `mongo -u username -p password`
   - Check firewall rules: Make sure MongoDB port is accessible

2. **MongoDB Atlas**
   - Verify connection string
   - Check if IP address is whitelisted in Atlas Network Access
   - Test connection from command line: `mongo "mongodb+srv://..."`

## Domain/Subdomain Issues

### Issue: Cannot Access API via Domain

1. **DNS Configuration**
   - Verify DNS records are correctly pointing to your server IP
   - Allow time for DNS propagation (can take up to 48 hours)

2. **Apache Configuration**
   - Check Apache proxy configuration in `.htaccess`
   - Verify Apache modules are enabled: `a2enmod proxy proxy_http rewrite`
   - Check Apache error logs: `/var/log/apache2/error.log`

3. **SSL Issues**
   - Ensure SSL certificate is correctly installed
   - Check for mixed content errors if accessing via HTTPS
   - Verify SSL certificate is not expired

## Performance Issues

### Issue: Application is Slow or Unresponsive

1. **Server Resources**
   - Check CPU/Memory usage in cPanel stats
   - Monitor server load: `top` or `htop`
   - Consider upgrading hosting plan if resources are consistently maxed out

2. **Application Optimization**
   - Enable Node.js clustering via PM2
   - Implement caching for frequent database queries
   - Use compression middleware (already configured in your app)
   - Optimize MongoDB queries (add indexes for frequent queries)

3. **Connection Pooling**
   - Ensure MongoDB connection pooling is configured properly
   - Check for connection leaks in your code

## File Permission Issues

### Issue: Cannot Write to Files or Directories

1. **Check File Permissions**
   - Files should be owned by your cPanel user
   - Set appropriate permissions: 
     ```bash
     find /home/username/nodejs/tourism-api -type d -exec chmod 755 {} \;
     find /home/username/nodejs/tourism-api -type f -exec chmod 644 {} \;
     ```
   - Make log directories writable:
     ```bash
     chmod -R 755 /home/username/nodejs/tourism-api/logs
     ```

## Environmental Issues

### Issue: Environment Variables Not Available

1. **Check Environment Configuration**
   - Verify environment variables are correctly set in cPanel Node.js app settings
   - Ensure `dotenv` is correctly configured in your app
   - Check for typos in variable names

2. **Restart Application**
   - After changing environment variables, restart the application
   - Check logs to verify variables are loaded

## cPanel-Specific Issues

### Issue: Node.js Version Issues

1. **Upgrade Node.js Version**
   - In cPanel, go to "Setup Node.js App"
   - Select your application
   - Choose a newer Node.js version
   - Save and restart

### Issue: Application Auto-Stops

1. **Memory Limits**
   - Check if your application is reaching memory limits
   - Optimize memory usage or increase limits in PM2 configuration
   - Monitor for memory leaks

2. **Long-Running Processes**
   - Use PM2 to keep your application running
   - Configure PM2 restart policies

## Deployment Issues

### Issue: Cannot Upload Large Files

1. **cPanel File Size Limits**
   - Use SSH/SCP instead of cPanel file manager
   - Split large files into smaller archives
   - Increase PHP upload limits in cPanel (PHP Configuration)

## Getting Help

If you've tried the solutions above and still face issues:

1. Contact your hosting provider's support
2. Check cPanel documentation
3. Search for specific error messages on Stack Overflow
4. Review Node.js and Express.js documentation for specific module errors 