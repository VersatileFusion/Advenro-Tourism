import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Book as BookIcon,
  Help as HelpIcon
} from '@mui/icons-material';

const Documentation = () => {
  const [expanded, setExpanded] = useState(false);
  const [docs, setDocs] = useState({
    api: [],
    guides: [],
    faq: []
  });

  useEffect(() => {
    fetchDocumentation();
  }, []);

  const fetchDocumentation = async () => {
    try {
      const response = await fetch('/api/docs');
      const data = await response.json();
      setDocs(data);
    } catch (error) {
      console.error('Error fetching documentation:', error);
    }
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const DocumentationCard = ({ title, icon: Icon, children }) => (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Icon />}
        title={title}
      />
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Documentation
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <DocumentationCard title="API Reference" icon={CodeIcon}>
            <List>
              {docs.api.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText primary={item.title} secondary={item.description} />
                  </ListItem>
                  {index < docs.api.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </DocumentationCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <DocumentationCard title="User Guides" icon={BookIcon}>
            <List>
              {docs.guides.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText primary={item.title} secondary={item.description} />
                  </ListItem>
                  {index < docs.guides.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </DocumentationCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <DocumentationCard title="FAQ" icon={HelpIcon}>
            <List>
              {docs.faq.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText primary={item.question} />
                  </ListItem>
                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Box sx={{ p: 2 }}>
                      <Typography>{item.answer}</Typography>
                    </Box>
                  </Collapse>
                  <IconButton onClick={handleExpandClick}>
                    <ExpandMoreIcon />
                  </IconButton>
                  {index < docs.faq.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </DocumentationCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Documentation; 